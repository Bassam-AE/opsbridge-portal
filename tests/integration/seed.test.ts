import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { verifyPassword } from "@/lib/auth/password";

type SeededUser = {
  username: string;
  accountType: "internal" | "client";
  status: string;
  passwordHash: string;
};

describe.sequential("development seed", () => {
  let temporaryDirectory: string;
  let databasePath: string;

  beforeAll(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), "service-portal-seed-"));
    databasePath = join(temporaryDirectory, "seed.sqlite");

    const database = new Database(databasePath);
    const migration = readFileSync(
      new URL("../../src/db/migrations/0000_adorable_sleeper.sql", import.meta.url),
      "utf8",
    ).replaceAll("--> statement-breakpoint", "");
    database.exec(migration);
    database.close();

    for (let run = 0; run < 2; run += 1) {
      execFileSync(process.execPath, ["--import", "tsx", "src/db/seed.ts"], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_PATH: databasePath },
        stdio: "pipe",
      });
    }
  });

  afterAll(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it("creates active internal and client login accounts without duplicates", async () => {
    const database = new Database(databasePath, { readonly: true });
    const seededUsers = database
      .prepare(
        `select username, account_type as accountType, status, password_hash as passwordHash
         from users
         where username in ('blindly', 'company')
         order by username`,
      )
      .all() as SeededUser[];
    const userCount = database.prepare("select count(*) as count from users").get() as {
      count: number;
    };
    database.close();

    expect(seededUsers.map(({ username, accountType, status }) => ({
      username,
      accountType,
      status,
    }))).toEqual([
      { username: "blindly", accountType: "internal", status: "active" },
      { username: "company", accountType: "client", status: "active" },
    ]);
    await expect(verifyPassword("blindly", seededUsers[0].passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("company", seededUsers[1].passwordHash)).resolves.toBe(true);
    expect(userCount.count).toBe(3);
  });

  it("assigns both accounts to the same demo client with compatible roles", () => {
    const database = new Database(databasePath, { readonly: true });
    const internalAssignment = database
      .prepare(
        `select c.client_code as clientCode, r.key as roleKey
         from employee_client_assignments a
         join users u on u.id = a.user_id
         join clients c on c.id = a.client_id
         join roles r on r.id = a.role_id
         where u.username = 'blindly' and a.status = 'active'`,
      )
      .get() as { clientCode: string; roleKey: string };
    const clientMembership = database
      .prepare(
        `select c.client_code as clientCode, r.key as roleKey
         from client_memberships m
         join users u on u.id = m.user_id
         join clients c on c.id = m.client_id
         join roles r on r.id = m.role_id
         where u.username = 'company' and m.status = 'active'`,
      )
      .get() as { clientCode: string; roleKey: string };
    const clientCount = database.prepare("select count(*) as count from clients").get() as {
      count: number;
    };
    const blindlyRestrictions = database
      .prepare(
        `select p.resource, p.action, o.effect
         from user_permission_overrides o
         join users u on u.id = o.user_id
         join permissions p on p.id = o.permission_id
         where u.username = 'blindly'
         order by p.resource`,
      )
      .all();
    database.close();

    expect(internalAssignment).toEqual({
      clientCode: "COMPANY",
      roleKey: "internal_sme",
    });
    expect(clientMembership).toEqual({
      clientCode: "COMPANY",
      roleKey: "client_owner",
    });
    expect(blindlyRestrictions).toEqual([
      { resource: "bms", action: "view", effect: "restriction" },
      { resource: "marketing", action: "view", effect: "restriction" },
    ]);
    expect(clientCount.count).toBe(1);
  });
});
