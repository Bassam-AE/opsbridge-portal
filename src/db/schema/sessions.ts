import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { users } from "./users";

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    lastSeenAt: text("last_seen_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    invalidatedAt: text("invalidated_at"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
