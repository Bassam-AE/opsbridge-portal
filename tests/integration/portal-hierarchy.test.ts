import { readFileSync } from "node:fs";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_PATH = ":memory:";

describe.sequential("provider and client-company hierarchy", () => {
  let dbModule: typeof import("@/db");
  let schema: typeof import("@/db/schema");
  let clientServices: typeof import("@/services/clients");
  let companyUserServices: typeof import("@/services/company-users");
  let adminSessionId: string;
  let employeeSessionId: string;
  let ownerSessionId: string;
  let clientAId: string;
  let clientBId: string;

  beforeAll(async () => {
    dbModule = await import("@/db");
    schema = await import("@/db/schema");
    clientServices = await import("@/services/clients");
    companyUserServices = await import("@/services/company-users");

    const migration = readFileSync(
      new URL("../../src/db/migrations/0000_adorable_sleeper.sql", import.meta.url),
      "utf8",
    ).replaceAll("--> statement-breakpoint", "");
    dbModule.sqlite.exec(migration);

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const adminUserId = crypto.randomUUID();
    const employeeUserId = crypto.randomUUID();
    const ownerUserId = crypto.randomUUID();
    const otherOwnerUserId = crypto.randomUUID();
    const adminRoleId = crypto.randomUUID();
    const employeeRoleId = crypto.randomUUID();
    const ownerRoleId = crypto.randomUUID();
    const clientEmployeeRoleId = crypto.randomUUID();
    adminSessionId = crypto.randomUUID();
    employeeSessionId = crypto.randomUUID();
    ownerSessionId = crypto.randomUUID();
    clientAId = crypto.randomUUID();
    clientBId = crypto.randomUUID();

    const permissionRows = [
      { id: crypto.randomUUID(), resource: "clients", action: "view" },
      { id: crypto.randomUUID(), resource: "admin_console", action: "view" },
      { id: crypto.randomUUID(), resource: "dashboard", action: "view" },
      { id: crypto.randomUUID(), resource: "users", action: "view" },
      { id: crypto.randomUUID(), resource: "users", action: "create" },
    ];

    await dbModule.db.insert(schema.users).values([
      {
        id: adminUserId,
        username: "hierarchy-admin",
        email: "hierarchy-admin@example.com",
        displayName: "Hierarchy Admin",
        accountType: "internal",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: employeeUserId,
        username: "bd-employee",
        email: "bd-employee@example.com",
        displayName: "BD Employee",
        accountType: "internal",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ownerUserId,
        username: "client-owner-a",
        email: "client-owner-a@example.com",
        displayName: "Client Owner A",
        accountType: "client",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: otherOwnerUserId,
        username: "client-owner-b",
        email: "client-owner-b@example.com",
        displayName: "Client Owner B",
        accountType: "client",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.roles).values([
      {
        id: adminRoleId,
        key: "hierarchy_admin",
        name: "Hierarchy Admin",
        audience: "internal",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: employeeRoleId,
        key: "hierarchy_employee",
        name: "Hierarchy Employee",
        audience: "internal",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ownerRoleId,
        key: "hierarchy_owner",
        name: "Hierarchy Owner",
        audience: "client",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: clientEmployeeRoleId,
        key: "client_employee",
        name: "Employee",
        audience: "client",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.permissions).values(
      permissionRows.map((permission) => ({ ...permission, createdAt: now })),
    );
    await dbModule.db.insert(schema.rolePermissions).values([
      ...permissionRows.slice(0, 2).map((permission) => ({
        roleId: adminRoleId,
        permissionId: permission.id,
        createdAt: now,
      })),
      {
        roleId: adminRoleId,
        permissionId: permissionRows[4].id,
        createdAt: now,
      },
      {
        roleId: employeeRoleId,
        permissionId: permissionRows[0].id,
        createdAt: now,
      },
      ...permissionRows.slice(2).map((permission) => ({
        roleId: ownerRoleId,
        permissionId: permission.id,
        createdAt: now,
      })),
    ]);
    await dbModule.db.insert(schema.internalUserRoles).values([
      { userId: adminUserId, roleId: adminRoleId, assignedAt: now },
      { userId: employeeUserId, roleId: employeeRoleId, assignedAt: now },
    ]);
    await dbModule.db.insert(schema.clients).values([
      {
        id: clientAId,
        clientCode: "CLIENT-A",
        name: "Client A",
        countryCode: "IN",
        clientType: "Test",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: clientBId,
        clientCode: "CLIENT-B",
        name: "Client B",
        countryCode: "AE",
        clientType: "Test",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.employeeClientAssignments).values({
      userId: employeeUserId,
      clientId: clientAId,
      roleId: employeeRoleId,
      status: "active",
      assignedAt: now,
    });
    await dbModule.db.insert(schema.clientMemberships).values([
      {
        userId: ownerUserId,
        clientId: clientAId,
        roleId: ownerRoleId,
        status: "active",
        joinedAt: now,
      },
      {
        userId: otherOwnerUserId,
        clientId: clientBId,
        roleId: ownerRoleId,
        status: "active",
        joinedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.sessions).values([
      {
        id: adminSessionId,
        userId: adminUserId,
        tokenHash: "hierarchy-admin-token",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
      {
        id: employeeSessionId,
        userId: employeeUserId,
        tokenHash: "hierarchy-employee-token",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
      {
        id: ownerSessionId,
        userId: ownerUserId,
        tokenHash: "hierarchy-owner-token",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
    ]);
  });

  afterAll(() => {
    dbModule.sqlite.close();
  });

  it("shows every client to administrators and only assignments to BD employees", async () => {
    const adminClients = await clientServices.listClients({
      sessionId: adminSessionId,
      search: "",
      limit: 20,
      offset: 0,
    });
    const employeeClients = await clientServices.listClients({
      sessionId: employeeSessionId,
      search: "",
      limit: 20,
      offset: 0,
    });

    expect(adminClients.items.map(({ clientCode }) => clientCode)).toEqual([
      "CLIENT-A",
      "CLIENT-B",
    ]);
    expect(employeeClients.items.map(({ clientCode }) => clientCode)).toEqual([
      "CLIENT-A",
    ]);
    await expect(
      clientServices.listClients({
        sessionId: ownerSessionId,
        search: "",
        limit: 20,
        offset: 0,
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      clientServices.getClientDetails({
        sessionId: employeeSessionId,
        clientId: clientBId,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      clientServices.getClientDetails({
        sessionId: adminSessionId,
        clientId: clientBId,
      }),
    ).resolves.toMatchObject({ canViewAllClients: true, canEnterClientPortal: false });
  });

  it("lets a client Owner create an invited employee only in the Owner's company", async () => {
    await expect(
      companyUserServices.createCompanyUser({
        sessionId: adminSessionId,
        displayName: "Wrong Portal User",
        email: "wrong-portal@example.com",
      }),
    ).rejects.toMatchObject({ code: "invalid_relationship" });

    const created = await companyUserServices.createCompanyUser({
      sessionId: ownerSessionId,
      displayName: "Client Employee",
      email: "client-employee@example.com",
      username: "client-employee",
      clientId: clientBId,
      accountType: "internal",
    });

    expect(created).toMatchObject({ clientId: clientAId, status: "invited" });
    const [membership] = await dbModule.db
      .select({
        clientId: schema.clientMemberships.clientId,
        roleKey: schema.roles.key,
        accountType: schema.users.accountType,
      })
      .from(schema.clientMemberships)
      .innerJoin(
        schema.users,
        eq(schema.clientMemberships.userId, schema.users.id),
      )
      .innerJoin(
        schema.roles,
        eq(schema.clientMemberships.roleId, schema.roles.id),
      )
      .where(eq(schema.users.id, created.id))
      .limit(1);

    expect(membership).toEqual({
      clientId: clientAId,
      roleKey: "client_employee",
      accountType: "client",
    });
    const visibleUsers = await companyUserServices.listCompanyUsers({
      sessionId: ownerSessionId,
      search: "",
      limit: 20,
      offset: 0,
    });
    expect(visibleUsers.items.map(({ displayName }) => displayName)).toEqual([
      "Client Employee",
      "Client Owner A",
    ]);
  });
});
