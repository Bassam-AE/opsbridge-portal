import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable(
  "clients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientCode: text("client_code").notNull(),
    name: text("name").notNull(),
    countryCode: text("country_code").notNull(),
    clientType: text("client_type").notNull(),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("clients_client_code_unique").on(table.clientCode),
    index("clients_name_idx").on(table.name),
    index("clients_status_idx").on(table.status),
    check("clients_country_code_check", sql`length(${table.countryCode}) = 2`),
    check("clients_status_check", sql`${table.status} in ('active', 'inactive')`),
  ],
);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
