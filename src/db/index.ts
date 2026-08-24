import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

import * as schema from "./schema";

const configuredDatabasePath =
  process.env.DATABASE_PATH ?? "./data/service-operations-portal.sqlite";

export const databasePath =
  configuredDatabasePath === ":memory:"
    ? configuredDatabasePath
    : resolve(process.cwd(), configuredDatabasePath);

if (databasePath !== ":memory:") {
  mkdirSync(dirname(databasePath), { recursive: true });
}

const globalDatabase = globalThis as unknown as {
  servicePortalSqlite?: Database.Database;
};

export const sqlite = globalDatabase.servicePortalSqlite ?? new Database(databasePath);

sqlite.pragma("foreign_keys = ON");
sqlite.pragma("journal_mode = WAL");

if (process.env.NODE_ENV !== "production") {
  globalDatabase.servicePortalSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
