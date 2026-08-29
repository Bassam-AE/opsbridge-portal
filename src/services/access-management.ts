import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  clientMemberships,
  clients,
  employeeClientAssignments,
  internalUserRoles,
  permissions,
  rolePermissions,
  roles,
  userPermissionOverrides,
  users,
} from "@/db/schema";
import { ACTIONS, type Action } from "@/lib/rbac/actions";
import {
  overrideScopeMatchesAccount,
  roleAudienceCanReceiveResource,
} from "@/lib/rbac/access-policy";
import { isPermissionPair } from "@/lib/rbac/permissions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { isResource, RESOURCES, type Resource } from "@/lib/rbac/resources";
import {
  createUserPermissionOverrideInputSchema,
  replaceRolePermissionsInputSchema,
  revokeUserPermissionOverrideInputSchema,
  updateUserPermissionOverrideInputSchema,
} from "@/lib/validation/access-management";
import {
  isUniqueConstraintError,
  ServiceMutationError,
} from "@/services/errors";
import { requireAuthorizedServiceActor } from "@/services/security";

type OverrideTarget = {
  userId: string;
  clientId: string | null;
  permissionId: string;
  accountType: "internal" | "client";
  resource: Resource;
  action: string;
};

async function requireAccessMutation(
  sessionId: string,
  resource: typeof RESOURCES.ROLES | typeof RESOURCES.USER_PERMISSION_OVERRIDES,
  action: Action,
) {
  const actorUserId = await requireAuthorizedServiceActor(sessionId, {
    clientId: null,
    resource,
    action,
  });

  await requirePermissionForSession(sessionId, {
    clientId: null,
    resource,
    action: ACTIONS.MANAGE_ACCESS,
  });

  return actorUserId;
}

async function findProviderRoleId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ roleId: internalUserRoles.roleId })
    .from(internalUserRoles)
    .where(eq(internalUserRoles.userId, userId))
    .limit(1);

  return row?.roleId ?? null;
}

export async function getCurrentProviderRoleId(sessionId: string) {
  const actorUserId = await requireAuthorizedServiceActor(sessionId, {
    clientId: null,
    resource: RESOURCES.ROLES,
    action: ACTIONS.VIEW,
  });

  return findProviderRoleId(actorUserId);
}

export async function replaceRolePermissions(rawInput: unknown) {
  const input = replaceRolePermissionsInputSchema.parse(rawInput);
  const actorUserId = await requireAccessMutation(
    input.sessionId,
    RESOURCES.ROLES,
    ACTIONS.EDIT,
  );
  const actorRoleId = await findProviderRoleId(actorUserId);

  if (input.roleId === actorRoleId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot change the permissions of your own provider role.",
    );
  }

  const [targetRole] = await db
    .select({ id: roles.id, audience: roles.audience, name: roles.name })
    .from(roles)
    .where(eq(roles.id, input.roleId))
    .limit(1);

  if (!targetRole) {
    throw new ServiceMutationError("not_found", "The selected role no longer exists.");
  }

  const requestedPermissions = input.permissionIds.length
    ? await db
        .select({
          id: permissions.id,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(permissions)
        .where(inArray(permissions.id, input.permissionIds))
    : [];

  if (requestedPermissions.length !== input.permissionIds.length) {
    throw new ServiceMutationError(
      "invalid_relationship",
      "One or more permission definitions no longer exist.",
    );
  }

  for (const permission of requestedPermissions) {
    if (
      !isResource(permission.resource) ||
      !isPermissionPair(permission.resource, permission.action) ||
      !roleAudienceCanReceiveResource(targetRole.audience, permission.resource)
    ) {
      throw new ServiceMutationError(
        "invalid_relationship",
        "The selected permission is incompatible with this role.",
      );
    }
  }

  const existing = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, input.roleId));
  const existingIds = new Set(existing.map(({ permissionId }) => permissionId));
  const requestedIds = new Set(input.permissionIds);
  const added = input.permissionIds.filter((id) => !existingIds.has(id));
  const removed = existing
    .map(({ permissionId }) => permissionId)
    .filter((id) => !requestedIds.has(id));
  const now = new Date().toISOString();

  db.transaction((transaction) => {
    if (removed.length) {
      transaction
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, input.roleId),
            inArray(rolePermissions.permissionId, removed),
          ),
        )
        .run();
    }

    if (added.length) {
      transaction
        .insert(rolePermissions)
        .values(
          added.map((permissionId) => ({
            roleId: input.roleId,
            permissionId,
            grantedByUserId: actorUserId,
            createdAt: now,
          })),
        )
        .run();
    }

    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: null,
        eventType: "role.permissions_changed",
        resource: RESOURCES.ROLES,
        action: ACTIONS.EDIT,
        targetType: "role",
        targetId: input.roleId,
        outcome: "success",
        reason: `${targetRole.name}: ${added.length} permission(s) added, ${removed.length} removed`,
        createdAt: now,
      })
      .run();
  });

  return { roleId: input.roleId, added: added.length, removed: removed.length };
}

async function requireValidOverrideTarget(
  userId: string,
  clientId: string | null,
  permissionId: string,
): Promise<OverrideTarget> {
  const [target] = await db
    .select({
      userId: users.id,
      accountType: users.accountType,
      status: users.status,
      permissionId: permissions.id,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(users)
    .innerJoin(permissions, eq(permissions.id, permissionId))
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    throw new ServiceMutationError(
      "not_found",
      "The selected user or permission no longer exists.",
    );
  }

  if (
    target.status === "disabled" ||
    !isResource(target.resource) ||
    !isPermissionPair(target.resource, target.action) ||
    !overrideScopeMatchesAccount(target.accountType, target.resource, clientId)
  ) {
    throw new ServiceMutationError(
      "invalid_relationship",
      "The selected user, permission, and scope are incompatible.",
    );
  }

  if (clientId) {
    const relationship =
      target.accountType === "internal"
        ? await db
            .select({ id: employeeClientAssignments.id })
            .from(employeeClientAssignments)
            .innerJoin(clients, eq(employeeClientAssignments.clientId, clients.id))
            .where(
              and(
                eq(employeeClientAssignments.userId, userId),
                eq(employeeClientAssignments.clientId, clientId),
                eq(employeeClientAssignments.status, "active"),
                eq(clients.status, "active"),
              ),
            )
            .limit(1)
        : await db
            .select({ id: clientMemberships.id })
            .from(clientMemberships)
            .innerJoin(clients, eq(clientMemberships.clientId, clients.id))
            .where(
              and(
                eq(clientMemberships.userId, userId),
                eq(clientMemberships.clientId, clientId),
                eq(clientMemberships.status, "active"),
                eq(clients.status, "active"),
              ),
            )
            .limit(1);

    if (!relationship.length) {
      throw new ServiceMutationError(
        "invalid_relationship",
        "The user does not have active access to the selected client company.",
      );
    }
  }

  return {
    userId: target.userId,
    clientId,
    permissionId: target.permissionId,
    accountType: target.accountType,
    resource: target.resource,
    action: target.action,
  };
}

export async function createUserPermissionOverride(rawInput: unknown) {
  const input = createUserPermissionOverrideInputSchema.parse(rawInput);
  const actorUserId = await requireAccessMutation(
    input.sessionId,
    RESOURCES.USER_PERMISSION_OVERRIDES,
    ACTIONS.CREATE,
  );

  if (actorUserId === input.userId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot grant or restrict your own permissions.",
    );
  }

  const target = await requireValidOverrideTarget(
    input.userId,
    input.clientId,
    input.permissionId,
  );
  const overrideId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.transaction((transaction) => {
      transaction
        .insert(userPermissionOverrides)
        .values({
          id: overrideId,
          userId: target.userId,
          clientId: target.clientId,
          permissionId: target.permissionId,
          effect: input.effect,
          reason: input.reason,
          createdByUserId: actorUserId,
          createdAt: now,
          expiresAt: input.expiresAt,
        })
        .run();
      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId: target.clientId,
          eventType: "user_permission_override.created",
          resource: RESOURCES.USER_PERMISSION_OVERRIDES,
          action: ACTIONS.CREATE,
          targetType: "user_permission_override",
          targetId: overrideId,
          outcome: "success",
          reason: `${input.effect} ${target.resource}:${target.action} — ${input.reason}`,
          createdAt: now,
        })
        .run();
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ServiceMutationError(
        "conflict",
        "An override already exists for this user, scope, and permission.",
      );
    }
    throw error;
  }

  return { id: overrideId };
}

async function loadOverride(overrideId: string) {
  const [row] = await db
    .select({
      id: userPermissionOverrides.id,
      userId: userPermissionOverrides.userId,
      clientId: userPermissionOverrides.clientId,
      permissionId: userPermissionOverrides.permissionId,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(userPermissionOverrides)
    .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
    .where(eq(userPermissionOverrides.id, overrideId))
    .limit(1);

  if (!row) {
    throw new ServiceMutationError("not_found", "The selected override no longer exists.");
  }

  return row;
}

export async function updateUserPermissionOverride(rawInput: unknown) {
  const input = updateUserPermissionOverrideInputSchema.parse(rawInput);
  const actorUserId = await requireAccessMutation(
    input.sessionId,
    RESOURCES.USER_PERMISSION_OVERRIDES,
    ACTIONS.EDIT,
  );
  const existing = await loadOverride(input.overrideId);

  if (actorUserId === existing.userId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot change your own permission override.",
    );
  }

  const now = new Date().toISOString();
  db.transaction((transaction) => {
    transaction
      .update(userPermissionOverrides)
      .set({ effect: input.effect, reason: input.reason, expiresAt: input.expiresAt })
      .where(eq(userPermissionOverrides.id, input.overrideId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: existing.clientId,
        eventType: "user_permission_override.updated",
        resource: RESOURCES.USER_PERMISSION_OVERRIDES,
        action: ACTIONS.EDIT,
        targetType: "user_permission_override",
        targetId: input.overrideId,
        outcome: "success",
        reason: `${input.effect} ${existing.resource}:${existing.action} — ${input.reason}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.overrideId };
}

export async function revokeUserPermissionOverride(rawInput: unknown) {
  const input = revokeUserPermissionOverrideInputSchema.parse(rawInput);
  const actorUserId = await requireAccessMutation(
    input.sessionId,
    RESOURCES.USER_PERMISSION_OVERRIDES,
    ACTIONS.DELETE,
  );
  const existing = await loadOverride(input.overrideId);

  if (actorUserId === existing.userId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot revoke your own permission override.",
    );
  }

  const now = new Date().toISOString();
  db.transaction((transaction) => {
    transaction
      .delete(userPermissionOverrides)
      .where(eq(userPermissionOverrides.id, input.overrideId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: existing.clientId,
        eventType: "user_permission_override.revoked",
        resource: RESOURCES.USER_PERMISSION_OVERRIDES,
        action: ACTIONS.DELETE,
        targetType: "user_permission_override",
        targetId: input.overrideId,
        outcome: "success",
        reason: `Revoked ${existing.resource}:${existing.action}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.overrideId };
}
