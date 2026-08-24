import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    username: text("username"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    accountType: text("account_type", { enum: ["internal", "client"] }).notNull(),
    status: text("status", { enum: ["invited", "active", "disabled"] })
      .notNull()
      .default("invited"),
    passwordHash: text("password_hash"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("users_username_unique")
      .on(table.username)
      .where(sql`${table.username} is not null`),
    uniqueIndex("users_email_unique").on(table.email),
    index("users_account_type_status_idx").on(table.accountType, table.status),
    check("users_email_normalized_check", sql`${table.email} = lower(${table.email})`),
    check(
      "users_username_normalized_check",
      sql`${table.username} is null or ${table.username} = lower(${table.username})`,
    ),
    check(
      "users_account_type_check",
      sql`${table.accountType} in ('internal', 'client')`,
    ),
    check(
      "users_status_check",
      sql`${table.status} in ('invited', 'active', 'disabled')`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
