import { relations } from "drizzle-orm";

import {
  internalUserRoles,
  permissions,
  rolePermissions,
  roles,
  userPermissionOverrides,
} from "./access";
import { auditLogs } from "./audit";
import { clientMemberships, employeeClientAssignments } from "./assignments";
import { clients } from "./clients";
import { sessions } from "./sessions";
import { users } from "./users";

export * from "./access";
export * from "./assignments";
export * from "./audit";
export * from "./clients";
export * from "./sessions";
export * from "./users";

export const usersRelations = relations(users, ({ one, many }) => ({
  internalRole: one(internalUserRoles, {
    fields: [users.id],
    references: [internalUserRoles.userId],
    relationName: "internal_user_role_user",
  }),
  employeeClientAssignments: many(employeeClientAssignments, {
    relationName: "employee_assignment_user",
  }),
  assignedEmployeeClientAssignments: many(employeeClientAssignments, {
    relationName: "employee_assignment_assigner",
  }),
  clientMemberships: many(clientMemberships, {
    relationName: "client_membership_user",
  }),
  assignedClientMemberships: many(clientMemberships, {
    relationName: "client_membership_assigner",
  }),
  permissionOverrides: many(userPermissionOverrides, {
    relationName: "permission_override_user",
  }),
  createdPermissionOverrides: many(userPermissionOverrides, {
    relationName: "permission_override_creator",
  }),
  grantedRolePermissions: many(rolePermissions, {
    relationName: "role_permission_granter",
  }),
  assignedInternalRoles: many(internalUserRoles, {
    relationName: "internal_user_role_assigner",
  }),
  sessions: many(sessions),
  auditLogs: many(auditLogs, { relationName: "audit_actor" }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  employeeAssignments: many(employeeClientAssignments),
  memberships: many(clientMemberships),
  permissionOverrides: many(userPermissionOverrides),
  auditLogs: many(auditLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  internalUsers: many(internalUserRoles),
  employeeAssignments: many(employeeClientAssignments),
  clientMemberships: many(clientMemberships),
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
  userOverrides: many(userPermissionOverrides),
}));

export const internalUserRolesRelations = relations(internalUserRoles, ({ one }) => ({
  user: one(users, {
    fields: [internalUserRoles.userId],
    references: [users.id],
    relationName: "internal_user_role_user",
  }),
  role: one(roles, {
    fields: [internalUserRoles.roleId],
    references: [roles.id],
  }),
  assignedBy: one(users, {
    fields: [internalUserRoles.assignedByUserId],
    references: [users.id],
    relationName: "internal_user_role_assigner",
  }),
}));

export const employeeClientAssignmentsRelations = relations(
  employeeClientAssignments,
  ({ one }) => ({
    user: one(users, {
      fields: [employeeClientAssignments.userId],
      references: [users.id],
      relationName: "employee_assignment_user",
    }),
    client: one(clients, {
      fields: [employeeClientAssignments.clientId],
      references: [clients.id],
    }),
    role: one(roles, {
      fields: [employeeClientAssignments.roleId],
      references: [roles.id],
    }),
    assignedBy: one(users, {
      fields: [employeeClientAssignments.assignedByUserId],
      references: [users.id],
      relationName: "employee_assignment_assigner",
    }),
  }),
);

export const clientMembershipsRelations = relations(clientMemberships, ({ one }) => ({
  user: one(users, {
    fields: [clientMemberships.userId],
    references: [users.id],
    relationName: "client_membership_user",
  }),
  client: one(clients, {
    fields: [clientMemberships.clientId],
    references: [clients.id],
  }),
  role: one(roles, {
    fields: [clientMemberships.roleId],
    references: [roles.id],
  }),
  assignedBy: one(users, {
    fields: [clientMemberships.assignedByUserId],
    references: [users.id],
    relationName: "client_membership_assigner",
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
  grantedBy: one(users, {
    fields: [rolePermissions.grantedByUserId],
    references: [users.id],
    relationName: "role_permission_granter",
  }),
}));

export const userPermissionOverridesRelations = relations(
  userPermissionOverrides,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissionOverrides.userId],
      references: [users.id],
      relationName: "permission_override_user",
    }),
    client: one(clients, {
      fields: [userPermissionOverrides.clientId],
      references: [clients.id],
    }),
    permission: one(permissions, {
      fields: [userPermissionOverrides.permissionId],
      references: [permissions.id],
    }),
    createdBy: one(users, {
      fields: [userPermissionOverrides.createdByUserId],
      references: [users.id],
      relationName: "permission_override_creator",
    }),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
    relationName: "audit_actor",
  }),
  client: one(clients, {
    fields: [auditLogs.clientId],
    references: [clients.id],
  }),
}));
