import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { clients } from "./clients";
import { users } from "./users";

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    eventType: text("event_type").notNull(),
    resource: text("resource"),
    action: text("action"),
    targetType: text("target_type"),
    targetId: text("target_id"),
    outcome: text("outcome", { enum: ["success", "failure", "denied"] }).notNull(),
    reason: text("reason"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("audit_logs_actor_created_at_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_client_created_at_idx").on(table.clientId, table.createdAt),
    index("audit_logs_outcome_created_at_idx").on(table.outcome, table.createdAt),
    check(
      "audit_logs_outcome_check",
      sql`${table.outcome} in ('success', 'failure', 'denied')`,
    ),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
