import { readFileSync } from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_PATH = ":memory:";

describe.sequential("access-management services", () => {
  let adminSessionId: string;
  let targetSessionId: string;
  let adminRoleId: string;
  let targetRoleId: string;
  let targetUserId: string;
  let dashboardPermissionId: string;
  let accessManagement: typeof import("@/services/access-management");
  let authorize: typeof import("@/lib/rbac/authorize").authorize;
  let dbModule: typeof import("@/db");
  let schema: typeof import("@/db/schema");

  beforeAll(async () => {
    dbModule = await import("@/db");
    schema = await import("@/db/schema");
    accessManagement = await import("@/services/access-management");
    ({ authorize } = await import("@/lib/rbac/authorize"));

    const migration = readFileSync(
      new URL("../../src/db/migrations/0000_adorable_sleeper.sql", import.meta.url),
      "utf8",
    ).replaceAll("--> statement-breakpoint", "");
    dbModule.sqlite.exec(migration);

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const adminUserId = crypto.randomUUID();
    targetUserId = crypto.randomUUID();
    adminRoleId = crypto.randomUUID();
    targetRoleId = crypto.randomUUID();
    adminSessionId = crypto.randomUUID();
    targetSessionId = crypto.randomUUID();
    dashboardPermissionId = crypto.randomUUID();

    const permissionRows = [
      { id: crypto.randomUUID(), resource: "roles", action: "edit" },
      { id: crypto.randomUUID(), resource: "roles", action: "manage_access" },
      { id: crypto.randomUUID(), resource: "user_permission_overrides", action: "create" },
      { id: crypto.randomUUID(), resource: "user_permission_overrides", action: "edit" },
      { id: crypto.randomUUID(), resource: "user_permission_overrides", action: "delete" },
      { id: crypto.randomUUID(), resource: "user_permission_overrides", action: "manage_access" },
      { id: dashboardPermissionId, resource: "dashboard", action: "view" },
    ];

    await dbModule.db.insert(schema.users).values([
      {
        id: adminUserId,
        username: "admin-test",
        email: "admin-test@example.com",
        displayName: "Admin Test",
        accountType: "internal",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: targetUserId,
        username: "target-test",
        email: "target-test@example.com",
        displayName: "Target Test",
        accountType: "internal",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.roles).values([
      {
        id: adminRoleId,
        key: "test_admin",
        name: "Test Admin",
        audience: "internal",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: targetRoleId,
        key: "test_target",
        name: "Test Target",
        audience: "internal",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.permissions).values(
      permissionRows.map((permission) => ({ ...permission, createdAt: now })),
    );
    await dbModule.db.insert(schema.internalUserRoles).values([
      { userId: adminUserId, roleId: adminRoleId, assignedAt: now },
      { userId: targetUserId, roleId: targetRoleId, assignedAt: now },
    ]);
    await dbModule.db.insert(schema.rolePermissions).values(
      permissionRows.slice(0, 6).map((permission) => ({
        roleId: adminRoleId,
        permissionId: permission.id,
        createdAt: now,
      })),
    );
    await dbModule.db.insert(schema.sessions).values([
      {
        id: adminSessionId,
        userId: adminUserId,
        tokenHash: "admin-token-hash",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
      {
        id: targetSessionId,
        userId: targetUserId,
        tokenHash: "target-token-hash",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
    ]);
  });

  afterAll(() => {
    dbModule.sqlite.close();
  });

  it("blocks administrators from changing their own provider role", async () => {
    await expect(
      accessManagement.replaceRolePermissions({
        sessionId: adminSessionId,
        roleId: adminRoleId,
        permissionIds: [],
      }),
    ).rejects.toMatchObject({ code: "self_access_change" });
  });

  it("applies role and override changes on the next decision and audits them", async () => {
    await accessManagement.replaceRolePermissions({
      sessionId: adminSessionId,
      roleId: targetRoleId,
      permissionIds: [dashboardPermissionId],
    });

    await expect(
      authorize(
        {
          sessionId: targetSessionId,
          clientId: null,
          resource: "dashboard",
          action: "view",
        },
        { auditDenied: false },
      ),
    ).resolves.toMatchObject({ allowed: true, reason: "role_permission" });

    const override = await accessManagement.createUserPermissionOverride({
      sessionId: adminSessionId,
      userId: targetUserId,
      clientId: null,
      permissionId: dashboardPermissionId,
      effect: "restriction",
      reason: "Temporary security restriction",
      expiresAt: null,
    });

    await expect(
      authorize(
        {
          sessionId: targetSessionId,
          clientId: null,
          resource: "dashboard",
          action: "view",
        },
        { auditDenied: false },
      ),
    ).resolves.toMatchObject({ allowed: false, reason: "user_restriction" });

    await accessManagement.updateUserPermissionOverride({
      sessionId: adminSessionId,
      overrideId: override.id,
      effect: "grant",
      reason: "Temporary access approved",
      expiresAt: null,
    });

    await expect(
      authorize(
        {
          sessionId: targetSessionId,
          clientId: null,
          resource: "dashboard",
          action: "view",
        },
        { auditDenied: false },
      ),
    ).resolves.toMatchObject({ allowed: true, reason: "user_grant" });

    await accessManagement.revokeUserPermissionOverride({
      sessionId: adminSessionId,
      overrideId: override.id,
    });

    await expect(
      authorize(
        {
          sessionId: targetSessionId,
          clientId: null,
          resource: "dashboard",
          action: "view",
        },
        { auditDenied: false },
      ),
    ).resolves.toMatchObject({ allowed: true, reason: "role_permission" });

    const auditRows = await dbModule.db.select().from(schema.auditLogs);
    expect(auditRows.map(({ eventType }) => eventType)).toEqual([
      "role.permissions_changed",
      "user_permission_override.created",
      "user_permission_override.updated",
      "user_permission_override.revoked",
    ]);
  });
});
