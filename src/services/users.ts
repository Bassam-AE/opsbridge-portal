import { and, asc, count, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  clientMemberships,
  clients,
  internalUserRoles,
  roles,
  sessions,
  users,
} from "@/db/schema";
import { ACTIONS } from "@/lib/rbac/actions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import {
  createUserInputSchema,
  paginatedListInputSchema,
  setUserStatusInputSchema,
  type PaginatedListInput,
} from "@/lib/validation/access";
import {
  isUniqueConstraintError,
  ServiceMutationError,
} from "@/services/errors";
import { requireAuthorizedServiceActor } from "@/services/security";
import type { PaginatedResult } from "@/services/types";

export type UserListItem = {
  id: string;
  username: string | null;
  email: string;
  displayName: string;
  accountType: "internal" | "client";
  status: "invited" | "active" | "disabled";
  createdAt: string;
};

export async function listUsers(
  rawInput: PaginatedListInput,
): Promise<PaginatedResult<UserListItem>> {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.USERS,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(users.displayName, `%${input.search}%`),
        like(users.email, `%${input.search}%`),
        like(users.username, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      accountType: users.accountType,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users);
  const countQuery = db.select({ value: count() }).from(users);

  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(asc(users.displayName))
      .limit(input.limit)
      .offset(input.offset),
    searchFilter ? countQuery.where(searchFilter) : countQuery,
  ]);

  return {
    items,
    total: totalRow?.value ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function createUser(rawInput: unknown) {
  const input = createUserInputSchema.parse(rawInput);
  const actorUserId = await requireAuthorizedServiceActor(input.sessionId, {
    clientId: null,
    resource: RESOURCES.USERS,
    action: ACTIONS.CREATE,
  });

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.USERS,
    action: ACTIONS.MANAGE_ACCESS,
  });

  const [role] = await db
    .select({ id: roles.id, audience: roles.audience })
    .from(roles)
    .where(eq(roles.id, input.roleId))
    .limit(1);

  if (!role || role.audience !== input.accountType) {
    throw new ServiceMutationError(
      "invalid_relationship",
      "The selected role does not apply to this account type.",
    );
  }

  if (input.accountType === "client") {
    await requirePermissionForSession(input.sessionId, {
      clientId: null,
      resource: RESOURCES.CLIENT_ASSIGNMENTS,
      action: ACTIONS.CREATE,
    });
    await requirePermissionForSession(input.sessionId, {
      clientId: null,
      resource: RESOURCES.CLIENT_ASSIGNMENTS,
      action: ACTIONS.MANAGE_ACCESS,
    });

    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, input.clientId!), eq(clients.status, "active")))
      .limit(1);

    if (!client) {
      throw new ServiceMutationError(
        "invalid_relationship",
        "The selected client company no longer exists.",
      );
    }
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  try {
    db.transaction((transaction) => {
      transaction
        .insert(users)
        .values({
          id: userId,
          username: input.username ?? null,
          email: input.email,
          displayName: input.displayName,
          accountType: input.accountType,
          status: "invited",
          passwordHash: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      if (input.accountType === "internal") {
        transaction
          .insert(internalUserRoles)
          .values({
            userId,
            roleId: input.roleId,
            assignedByUserId: actorUserId,
            assignedAt: now,
          })
          .run();
      } else {
        transaction
          .insert(clientMemberships)
          .values({
            userId,
            clientId: input.clientId!,
            roleId: input.roleId,
            status: "active",
            assignedByUserId: actorUserId,
            joinedAt: now,
          })
          .run();
      }

      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId: input.accountType === "client" ? input.clientId! : null,
          eventType: "user.created",
          resource: RESOURCES.USERS,
          action: ACTIONS.CREATE,
          targetType: "user",
          targetId: userId,
          outcome: "success",
          reason: `${input.accountType} user created with invited status`,
          createdAt: now,
        })
        .run();
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ServiceMutationError(
        "conflict",
        "A user with this email or username already exists.",
      );
    }

    throw error;
  }

  return { id: userId, status: "invited" as const };
}

export async function setUserStatus(rawInput: unknown) {
  const input = setUserStatusInputSchema.parse(rawInput);
  const permissionAction =
    input.status === "disabled" ? ACTIONS.DELETE : ACTIONS.EDIT;
  const actorUserId = await requireAuthorizedServiceActor(input.sessionId, {
    clientId: null,
    resource: RESOURCES.USERS,
    action: permissionAction,
  });

  if (actorUserId === input.targetUserId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot disable or enable your own account.",
    );
  }

  const [target] = await db
    .select({ status: users.status, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, input.targetUserId))
    .limit(1);

  if (!target) {
    throw new ServiceMutationError("not_found", "The selected user no longer exists.");
  }

  const nextStatus =
    input.status === "active" && !target.passwordHash ? "invited" : input.status;
  const now = new Date().toISOString();

  db.transaction((transaction) => {
    transaction
      .update(users)
      .set({ status: nextStatus, updatedAt: now })
      .where(eq(users.id, input.targetUserId))
      .run();

    if (nextStatus === "disabled") {
      transaction
        .update(sessions)
        .set({ invalidatedAt: now })
        .where(eq(sessions.userId, input.targetUserId))
        .run();
    }

    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        eventType: "user.status_changed",
        resource: RESOURCES.USERS,
        action: permissionAction,
        targetType: "user",
        targetId: input.targetUserId,
        outcome: "success",
        reason: `${target.status} -> ${nextStatus}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.targetUserId, status: nextStatus };
}
