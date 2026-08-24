import { asc, count, desc, eq, inArray, like, or } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  clientMemberships,
  clients,
  employeeClientAssignments,
  permissions,
  rolePermissions,
  roles,
  userPermissionOverrides,
  users,
} from "@/db/schema";
import { ACTIONS } from "@/lib/rbac/actions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import {
  paginatedListInputSchema,
  type PaginatedListInput,
} from "@/lib/validation/access";
import type { PaginatedResult } from "@/services/types";

export async function listRoles(rawInput: PaginatedListInput) {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.ROLES,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(roles.key, `%${input.search}%`),
        like(roles.name, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
    .select({
      id: roles.id,
      key: roles.key,
      name: roles.name,
      audience: roles.audience,
      description: roles.description,
    })
    .from(roles);
  const countQuery = db.select({ value: count() }).from(roles);
  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(asc(roles.name))
      .limit(input.limit)
      .offset(input.offset),
    searchFilter ? countQuery.where(searchFilter) : countQuery,
  ]);

  return { items, total: totalRow?.value ?? 0, limit: input.limit, offset: input.offset };
}

export async function listPermissionDefinitions(rawInput: PaginatedListInput) {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.PERMISSIONS,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(permissions.resource, `%${input.search}%`),
        like(permissions.action, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
    .select({
      id: permissions.id,
      resource: permissions.resource,
      action: permissions.action,
      description: permissions.description,
    })
    .from(permissions);
  const countQuery = db.select({ value: count() }).from(permissions);
  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(asc(permissions.resource), asc(permissions.action))
      .limit(input.limit)
      .offset(input.offset),
    searchFilter ? countQuery.where(searchFilter) : countQuery,
  ]);

  return { items, total: totalRow?.value ?? 0, limit: input.limit, offset: input.offset };
}

export async function listRolesWithPermissions(rawInput: PaginatedListInput) {
  const input = paginatedListInputSchema.parse(rawInput);
  const roleResult = await listRoles({
    sessionId: input.sessionId,
    search: "",
    limit: 100,
    offset: 0,
  });

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.PERMISSIONS,
    action: ACTIONS.VIEW,
  });

  const roleIds = roleResult.items.map(({ id }) => id);
  const permissionRows = roleIds.length
    ? await db
        .select({
          roleId: rolePermissions.roleId,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds))
        .orderBy(asc(permissions.resource), asc(permissions.action))
    : [];

  const rolesWithPermissions = roleResult.items.map((role) => ({
      ...role,
      permissions: permissionRows
        .filter(({ roleId }) => roleId === role.id)
        .map(({ resource, action }) => ({ resource, action })),
    }));
  const normalizedSearch = input.search.toLowerCase();
  const filteredRoles = normalizedSearch
    ? rolesWithPermissions.filter(
        (role) =>
          role.name.toLowerCase().includes(normalizedSearch) ||
          role.key.toLowerCase().includes(normalizedSearch) ||
          role.permissions.some(
            ({ resource, action }) =>
              resource.toLowerCase().includes(normalizedSearch) ||
              action.toLowerCase().includes(normalizedSearch) ||
              `${resource}:${action}`.toLowerCase().includes(normalizedSearch),
          ),
      )
    : rolesWithPermissions;

  return {
    items: filteredRoles.slice(input.offset, input.offset + input.limit),
    total: filteredRoles.length,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function listClientAssignments(rawInput: PaginatedListInput) {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENT_ASSIGNMENTS,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(users.displayName, `%${input.search}%`),
        like(clients.name, `%${input.search}%`),
        like(roles.name, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
    .select({
      id: employeeClientAssignments.id,
      userId: employeeClientAssignments.userId,
      userName: users.displayName,
      clientId: employeeClientAssignments.clientId,
      clientName: clients.name,
      roleId: employeeClientAssignments.roleId,
      roleName: roles.name,
      status: employeeClientAssignments.status,
      assignedAt: employeeClientAssignments.assignedAt,
    })
    .from(employeeClientAssignments)
    .innerJoin(users, eq(employeeClientAssignments.userId, users.id))
    .innerJoin(clients, eq(employeeClientAssignments.clientId, clients.id))
    .innerJoin(roles, eq(employeeClientAssignments.roleId, roles.id));
  const countQuery = db
    .select({ value: count() })
    .from(employeeClientAssignments)
    .innerJoin(users, eq(employeeClientAssignments.userId, users.id))
    .innerJoin(clients, eq(employeeClientAssignments.clientId, clients.id))
    .innerJoin(roles, eq(employeeClientAssignments.roleId, roles.id));
  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(desc(employeeClientAssignments.assignedAt))
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

export async function listClientMemberships(rawInput: PaginatedListInput) {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENT_ASSIGNMENTS,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(users.displayName, `%${input.search}%`),
        like(clients.name, `%${input.search}%`),
        like(roles.name, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
    .select({
      id: clientMemberships.id,
      userId: clientMemberships.userId,
      userName: users.displayName,
      clientId: clientMemberships.clientId,
      clientName: clients.name,
      roleId: clientMemberships.roleId,
      roleName: roles.name,
      status: clientMemberships.status,
      joinedAt: clientMemberships.joinedAt,
    })
    .from(clientMemberships)
    .innerJoin(users, eq(clientMemberships.userId, users.id))
    .innerJoin(clients, eq(clientMemberships.clientId, clients.id))
    .innerJoin(roles, eq(clientMemberships.roleId, roles.id));
  const countQuery = db
    .select({ value: count() })
    .from(clientMemberships)
    .innerJoin(users, eq(clientMemberships.userId, users.id))
    .innerJoin(clients, eq(clientMemberships.clientId, clients.id))
    .innerJoin(roles, eq(clientMemberships.roleId, roles.id));
  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(desc(clientMemberships.joinedAt))
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

export async function listUserPermissionOverrides(
  rawInput: PaginatedListInput,
): Promise<PaginatedResult<{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  clientId: string | null;
  clientName: string | null;
  permissionId: string;
  resource: string;
  action: string;
  effect: "grant" | "restriction";
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
}>> {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.USER_PERMISSION_OVERRIDES,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(users.displayName, `%${input.search}%`),
        like(users.email, `%${input.search}%`),
        like(clients.name, `%${input.search}%`),
        like(permissions.resource, `%${input.search}%`),
        like(permissions.action, `%${input.search}%`),
        like(userPermissionOverrides.effect, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
      .select({
        id: userPermissionOverrides.id,
        userId: userPermissionOverrides.userId,
        userName: users.displayName,
        userEmail: users.email,
        clientId: userPermissionOverrides.clientId,
        clientName: clients.name,
        permissionId: userPermissionOverrides.permissionId,
        resource: permissions.resource,
        action: permissions.action,
        effect: userPermissionOverrides.effect,
        reason: userPermissionOverrides.reason,
        expiresAt: userPermissionOverrides.expiresAt,
        createdAt: userPermissionOverrides.createdAt,
      })
      .from(userPermissionOverrides)
      .innerJoin(users, eq(userPermissionOverrides.userId, users.id))
      .innerJoin(
        permissions,
        eq(userPermissionOverrides.permissionId, permissions.id),
      )
      .leftJoin(clients, eq(userPermissionOverrides.clientId, clients.id));
  const countQuery = db
    .select({ value: count() })
    .from(userPermissionOverrides)
    .innerJoin(users, eq(userPermissionOverrides.userId, users.id))
    .innerJoin(
      permissions,
      eq(userPermissionOverrides.permissionId, permissions.id),
    )
    .leftJoin(clients, eq(userPermissionOverrides.clientId, clients.id));
  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(desc(userPermissionOverrides.createdAt))
      .limit(input.limit)
      .offset(input.offset),
    searchFilter ? countQuery.where(searchFilter) : countQuery,
  ]);

  return { items, total: totalRow?.value ?? 0, limit: input.limit, offset: input.offset };
}

export async function listAuditLogs(
  rawInput: PaginatedListInput,
): Promise<PaginatedResult<{
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  clientId: string | null;
  clientName: string | null;
  eventType: string;
  resource: string | null;
  action: string | null;
  outcome: "success" | "failure" | "denied";
  reason: string | null;
  createdAt: string;
}>> {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.AUDIT_LOGS,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(auditLogs.eventType, `%${input.search}%`),
        like(auditLogs.resource, `%${input.search}%`),
        like(auditLogs.action, `%${input.search}%`),
        like(auditLogs.outcome, `%${input.search}%`),
        like(auditLogs.reason, `%${input.search}%`),
        like(users.displayName, `%${input.search}%`),
        like(clients.name, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
      .select({
        id: auditLogs.id,
        actorUserId: auditLogs.actorUserId,
        actorName: users.displayName,
        clientId: auditLogs.clientId,
        clientName: clients.name,
        eventType: auditLogs.eventType,
        resource: auditLogs.resource,
        action: auditLogs.action,
        outcome: auditLogs.outcome,
        reason: auditLogs.reason,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .leftJoin(clients, eq(auditLogs.clientId, clients.id));
  const countQuery = db
    .select({ value: count() })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .leftJoin(clients, eq(auditLogs.clientId, clients.id));
  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(desc(auditLogs.createdAt))
      .limit(input.limit)
      .offset(input.offset),
    searchFilter ? countQuery.where(searchFilter) : countQuery,
  ]);

  return { items, total: totalRow?.value ?? 0, limit: input.limit, offset: input.offset };
}
