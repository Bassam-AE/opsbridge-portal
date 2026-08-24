import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { roles } from "./access";
import { clients } from "./clients";
import { users } from "./users";

export const employeeClientAssignments = sqliteTable(
  "employee_client_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    assignedByUserId: text("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    assignedAt: text("assigned_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    endedAt: text("ended_at"),
  },
  (table) => [
    uniqueIndex("employee_client_assignments_user_client_unique").on(
      table.userId,
      table.clientId,
    ),
    index("employee_client_assignments_client_status_idx").on(
      table.clientId,
      table.status,
    ),
    index("employee_client_assignments_role_idx").on(table.roleId),
    check(
      "employee_client_assignments_status_check",
      sql`${table.status} in ('active', 'inactive')`,
    ),
  ],
);

export const clientMemberships = sqliteTable(
  "client_memberships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    assignedByUserId: text("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    joinedAt: text("joined_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("client_memberships_user_unique").on(table.userId),
    index("client_memberships_client_status_idx").on(table.clientId, table.status),
    index("client_memberships_role_idx").on(table.roleId),
    check("client_memberships_status_check", sql`${table.status} in ('active', 'inactive')`),
  ],
);

export type EmployeeClientAssignment = typeof employeeClientAssignments.$inferSelect;
export type ClientMembership = typeof clientMemberships.$inferSelect;
