import { and, eq, gt, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  clientMemberships,
  clients,
  employeeClientAssignments,
  internalUserRoles,
  permissions,
  rolePermissions,
  sessions,
  userPermissionOverrides,
  users,
} from "@/db/schema";
import { type PermissionKey, isPermissionPair } from "@/lib/rbac/permissions";
import { RESOURCE_DEFINITIONS } from "@/lib/rbac/resources";
import type {
  AuthorizationDecision,
  AuthorizationFacts,
  AuthorizationRequest,
} from "@/lib/rbac/types";

type AccountType = "internal" | "client";

type LoadedAuthorizationFacts = {
  actorUserId: string | null;
  facts: AuthorizationFacts;
};

const emptyFacts: AuthorizationFacts = {
  permission: null,
  permissionIsConfigured: false,
  sessionIsValid: false,
  userIsActive: false,
  clientScopeIsValid: false,
  hasUserRestriction: false,
  hasUserGrant: false,
  roleHasPermission: false,
};

export function evaluateAuthorization(
  facts: AuthorizationFacts,
): AuthorizationDecision {
  if (!facts.sessionIsValid) {
    return { allowed: false, reason: "invalid_session", permission: facts.permission };
  }

  if (!facts.userIsActive) {
    return { allowed: false, reason: "disabled_user", permission: facts.permission };
  }

  if (!facts.clientScopeIsValid) {
    return { allowed: false, reason: "invalid_client_scope", permission: facts.permission };
  }

  if (!facts.permission || !facts.permissionIsConfigured) {
    return {
      allowed: false,
      reason: "invalid_permission_definition",
      permission: facts.permission,
    };
  }

  if (facts.hasUserRestriction) {
    return { allowed: false, reason: "user_restriction", permission: facts.permission };
  }

  if (facts.hasUserGrant) {
    return { allowed: true, reason: "user_grant", permission: facts.permission };
  }

  if (facts.roleHasPermission) {
    return { allowed: true, reason: "role_permission", permission: facts.permission };
  }

  return { allowed: false, reason: "missing_permission", permission: facts.permission };
}

async function findProviderRoleId(userId: string): Promise<string | null> {
  const [providerRole] = await db
    .select({ roleId: internalUserRoles.roleId })
    .from(internalUserRoles)
    .where(eq(internalUserRoles.userId, userId))
    .limit(1);

  return providerRole?.roleId ?? null;
}

async function findClientRoleId(
  userId: string,
  accountType: AccountType,
  clientId: string,
): Promise<string | null> {
  if (accountType === "internal") {
    const [assignment] = await db
      .select({ roleId: employeeClientAssignments.roleId })
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
      .limit(1);

    return assignment?.roleId ?? null;
  }

  const [membership] = await db
    .select({ roleId: clientMemberships.roleId })
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

  return membership?.roleId ?? null;
}

async function resolveScope(
  userId: string,
  accountType: AccountType,
  request: AuthorizationRequest,
): Promise<{ isValid: boolean; roleId: string | null }> {
  const scope = RESOURCE_DEFINITIONS[request.resource].scope;

  if (scope === "provider") {
    if (accountType !== "internal" || request.clientId !== null) {
      return { isValid: false, roleId: null };
    }

    return { isValid: true, roleId: await findProviderRoleId(userId) };
  }

  if (scope === "client") {
    if (!request.clientId) {
      return { isValid: false, roleId: null };
    }

    const roleId = await findClientRoleId(userId, accountType, request.clientId);
    return { isValid: roleId !== null, roleId };
  }

  if (request.clientId === null) {
    if (accountType !== "internal") {
      return { isValid: false, roleId: null };
    }

    return { isValid: true, roleId: await findProviderRoleId(userId) };
  }

  const roleId = await findClientRoleId(userId, accountType, request.clientId);
  return { isValid: roleId !== null, roleId };
}

async function loadAuthorizationFacts(
  request: AuthorizationRequest,
): Promise<LoadedAuthorizationFacts> {
  const permission = isPermissionPair(request.resource, request.action)
    ? (`${request.resource}:${request.action}` as PermissionKey)
    : null;
  const now = new Date().toISOString();
  const [identity] = await db
    .select({
      userId: users.id,
      accountType: users.accountType,
      status: users.status,
      expiresAt: sessions.expiresAt,
      invalidatedAt: sessions.invalidatedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, request.sessionId))
    .limit(1);

  if (!identity) {
    return { actorUserId: null, facts: { ...emptyFacts, permission } };
  }

  const sessionIsValid =
    identity.invalidatedAt === null && identity.expiresAt > now;
  const userIsActive = identity.status === "active";

  if (!sessionIsValid || !userIsActive) {
    return {
      actorUserId: identity.userId,
      facts: {
        ...emptyFacts,
        permission,
        sessionIsValid,
        userIsActive,
      },
    };
  }

  const scope = await resolveScope(
    identity.userId,
    identity.accountType,
    request,
  );

  if (!permission || !scope.isValid) {
    return {
      actorUserId: identity.userId,
      facts: {
        ...emptyFacts,
        permission,
        sessionIsValid: true,
        userIsActive: true,
        clientScopeIsValid: scope.isValid,
      },
    };
  }

  const [permissionRecord] = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(
      and(
        eq(permissions.resource, request.resource),
        eq(permissions.action, request.action),
      ),
    )
    .limit(1);

  if (!permissionRecord) {
    return {
      actorUserId: identity.userId,
      facts: {
        ...emptyFacts,
        permission,
        sessionIsValid: true,
        userIsActive: true,
        clientScopeIsValid: true,
      },
    };
  }

  const overrideScope = request.clientId
    ? eq(userPermissionOverrides.clientId, request.clientId)
    : isNull(userPermissionOverrides.clientId);

  const overrides = await db
    .select({ effect: userPermissionOverrides.effect })
    .from(userPermissionOverrides)
    .where(
      and(
        eq(userPermissionOverrides.userId, identity.userId),
        eq(userPermissionOverrides.permissionId, permissionRecord.id),
        overrideScope,
        or(
          isNull(userPermissionOverrides.expiresAt),
          gt(userPermissionOverrides.expiresAt, now),
        ),
      ),
    );

  const hasUserRestriction = overrides.some(
    ({ effect }) => effect === "restriction",
  );
  const hasUserGrant = overrides.some(({ effect }) => effect === "grant");
  let roleHasPermission = false;

  if (scope.roleId) {
    const [rolePermission] = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, scope.roleId),
          eq(rolePermissions.permissionId, permissionRecord.id),
        ),
      )
      .limit(1);

    roleHasPermission = Boolean(rolePermission);
  }

  return {
    actorUserId: identity.userId,
    facts: {
      permission,
      permissionIsConfigured: true,
      sessionIsValid: true,
      userIsActive: true,
      clientScopeIsValid: true,
      hasUserRestriction,
      hasUserGrant,
      roleHasPermission,
    },
  };
}

async function recordDeniedAuthorization(
  request: AuthorizationRequest,
  actorUserId: string | null,
  decision: Extract<AuthorizationDecision, { allowed: false }>,
): Promise<void> {
  const auditEntry = {
    actorUserId,
    clientId: request.clientId,
    eventType: "authorization.denied",
    resource: request.resource,
    action: request.action,
    targetType: request.clientId ? "client" : "provider",
    targetId: request.clientId,
    outcome: "denied" as const,
    reason: decision.reason,
  };

  try {
    await db.insert(auditLogs).values(auditEntry);
  } catch {
    if (!request.clientId) {
      return;
    }

    try {
      await db.insert(auditLogs).values({ ...auditEntry, clientId: null });
    } catch {
      // Authorization remains deny-by-default even if audit storage is unavailable.
    }
  }
}

export async function authorize(
  request: AuthorizationRequest,
  options: { auditDenied?: boolean } = {},
): Promise<AuthorizationDecision> {
  let actorUserId: string | null = null;
  let decision: AuthorizationDecision;

  try {
    const loaded = await loadAuthorizationFacts(request);
    actorUserId = loaded.actorUserId;
    decision = evaluateAuthorization(loaded.facts);
  } catch {
    decision = {
      allowed: false,
      reason: "authorization_error",
      permission: null,
    };
  }

  if (!decision.allowed && options.auditDenied !== false) {
    await recordDeniedAuthorization(request, actorUserId, decision);
  }

  return decision;
}
