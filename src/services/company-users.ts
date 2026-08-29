import { and, asc, count, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  clientMemberships,
  clients,
  roles,
  users,
} from "@/db/schema";
import { ACTIONS, type Action } from "@/lib/rbac/actions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import { ROLE_KEYS } from "@/lib/rbac/roles";
import {
  createCompanyUserInputSchema,
  paginatedListInputSchema,
  type PaginatedListInput,
} from "@/lib/validation/access";
import {
  isUniqueConstraintError,
  ServiceMutationError,
} from "@/services/errors";
import { requireValidServiceIdentity } from "@/services/security";
import type { PaginatedResult } from "@/services/types";

export type CompanyUserListItem = {
  id: string;
  username: string | null;
  email: string;
  displayName: string;
  status: "invited" | "active" | "disabled";
  roleName: string;
  membershipStatus: "active" | "inactive";
  createdAt: string;
};

async function requireOwnCompany(
  sessionId: string,
  action: Action,
): Promise<{ actorUserId: string; clientId: string }> {
  const identity = await requireValidServiceIdentity(sessionId);

  if (identity.accountType !== "client") {
    await requirePermissionForSession(sessionId, {
      clientId: null,
      resource: RESOURCES.USERS,
      action,
    });
    throw new ServiceMutationError(
      "invalid_relationship",
      "Company user management is available only inside a client company.",
    );
  }

  const [membership] = await db
    .select({ clientId: clientMemberships.clientId })
    .from(clientMemberships)
    .innerJoin(clients, eq(clientMemberships.clientId, clients.id))
    .where(
      and(
        eq(clientMemberships.userId, identity.userId),
        eq(clientMemberships.status, "active"),
        eq(clients.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ServiceMutationError(
      "invalid_relationship",
      "Your active client-company membership is unavailable.",
    );
  }

  await requirePermissionForSession(sessionId, {
    clientId: membership.clientId,
    resource: RESOURCES.USERS,
    action,
  });

  return { actorUserId: identity.userId, clientId: membership.clientId };
}

export async function listCompanyUsers(
  rawInput: PaginatedListInput,
): Promise<PaginatedResult<CompanyUserListItem>> {
  const input = paginatedListInputSchema.parse(rawInput);
  const { clientId } = await requireOwnCompany(input.sessionId, ACTIONS.VIEW);
  const searchFilter = input.search
    ? or(
        like(users.displayName, `%${input.search}%`),
        like(users.email, `%${input.search}%`),
        like(users.username, `%${input.search}%`),
      )
    : undefined;
  const scopeFilter = and(eq(clientMemberships.clientId, clientId), searchFilter);
  const selection = {
    id: users.id,
    username: users.username,
    email: users.email,
    displayName: users.displayName,
    status: users.status,
    roleName: roles.name,
    membershipStatus: clientMemberships.status,
    createdAt: users.createdAt,
  };
  const [items, [totalRow]] = await Promise.all([
    db
      .select(selection)
      .from(clientMemberships)
      .innerJoin(users, eq(clientMemberships.userId, users.id))
      .innerJoin(roles, eq(clientMemberships.roleId, roles.id))
      .where(scopeFilter)
      .orderBy(asc(users.displayName))
      .limit(input.limit)
      .offset(input.offset),
    db
      .select({ value: count() })
      .from(clientMemberships)
      .innerJoin(users, eq(clientMemberships.userId, users.id))
      .where(scopeFilter),
  ]);

  return {
    items,
    total: totalRow?.value ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function createCompanyUser(rawInput: unknown) {
  const input = createCompanyUserInputSchema.parse(rawInput);
  const { actorUserId, clientId } = await requireOwnCompany(
    input.sessionId,
    ACTIONS.CREATE,
  );
  const [employeeRole] = await db
    .select({ id: roles.id, audience: roles.audience })
    .from(roles)
    .where(eq(roles.key, ROLE_KEYS.CLIENT_EMPLOYEE))
    .limit(1);

  if (!employeeRole || employeeRole.audience !== "client") {
    throw new ServiceMutationError(
      "invalid_relationship",
      "The client Employee role is unavailable.",
    );
  }

  const userId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.transaction((transaction) => {
      transaction
        .insert(users)
        .values({
          id: userId,
          username: input.username ?? null,
          email: input.email,
          displayName: input.displayName,
          accountType: "client",
          status: "invited",
          passwordHash: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      transaction
        .insert(clientMemberships)
        .values({
          id: membershipId,
          userId,
          clientId,
          roleId: employeeRole.id,
          status: "active",
          assignedByUserId: actorUserId,
          joinedAt: now,
        })
        .run();
      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId,
          eventType: "company_user.created",
          resource: RESOURCES.USERS,
          action: ACTIONS.CREATE,
          targetType: "user",
          targetId: userId,
          outcome: "success",
          reason: "Client Employee created with invited status",
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

  return { id: userId, clientId, status: "invited" as const };
}
