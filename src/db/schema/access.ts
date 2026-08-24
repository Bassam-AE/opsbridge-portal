import { sql } from "drizzle-orm";
import {
  check,
  index,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { clients } from "./clients";
import { users } from "./users";

export const roles = sqliteTable(
  "roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull(),
    name: text("name").notNull(),
    audience: text("audience", { enum: ["internal", "client"] }).notNull(),
    description: text("description"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("roles_key_unique").on(table.key),
    index("roles_audience_idx").on(table.audience),
    check("roles_audience_check", sql`${table.audience} in ('internal', 'client')`),
  ],
);

export const permissions = sqliteTable(
  "permissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("permissions_resource_action_unique").on(table.resource, table.action),
    index("permissions_resource_idx").on(table.resource),
  ],
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    grantedByUserId: text("granted_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("role_permissions_permission_idx").on(table.permissionId),
  ],
);

export const internalUserRoles = sqliteTable(
  "internal_user_roles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    assignedByUserId: text("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    assignedAt: text("assigned_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("internal_user_roles_role_idx").on(table.roleId)],
);

export const userPermissionOverrides = sqliteTable(
  "user_permission_overrides",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    effect: text("effect", { enum: ["grant", "restriction"] }).notNull(),
    reason: text("reason"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    expiresAt: text("expires_at"),
  },
  (table) => [
    uniqueIndex("user_permission_overrides_global_unique")
      .on(table.userId, table.permissionId)
      .where(sql`${table.clientId} is null`),
    uniqueIndex("user_permission_overrides_client_unique")
      .on(table.userId, table.clientId, table.permissionId)
      .where(sql`${table.clientId} is not null`),
    index("user_permission_overrides_lookup_idx").on(
      table.userId,
      table.clientId,
      table.permissionId,
      table.effect,
    ),
    index("user_permission_overrides_client_idx").on(table.clientId),
    check(
      "user_permission_overrides_effect_check",
      sql`${table.effect} in ('grant', 'restriction')`,
    ),
  ],
);

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type UserPermissionOverride = typeof userPermissionOverrides.$inferSelect;
