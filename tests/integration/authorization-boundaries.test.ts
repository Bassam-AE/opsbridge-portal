import { readFileSync } from "node:fs";

import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_PATH = ":memory:";

describe.sequential("authentication and authorization boundaries", () => {
  let dbModule: typeof import("@/db");
  let schema: typeof import("@/db/schema");
  let authorize: typeof import("@/lib/rbac/authorize").authorize;
  let authorizePortalPageView: typeof import("@/lib/rbac/authorize").authorizePortalPageView;
  let findSession: typeof import("@/lib/auth/session").findSession;
  let loginPost: typeof import("@/app/api/auth/login/route").POST;
  let logoutPost: typeof import("@/app/api/auth/logout/route").POST;
  let listUsers: typeof import("@/services/users").listUsers;
  let listAvailableClientContexts: typeof import("@/services/client-context").listAvailableClientContexts;
  let internalSessionId: string;
  let clientSessionId: string;
  let disabledSessionId: string;
  let clientAId: string;
  let clientBId: string;

  beforeAll(async () => {
    dbModule = await import("@/db");
    schema = await import("@/db/schema");
    ({ authorize, authorizePortalPageView } = await import("@/lib/rbac/authorize"));
    ({ findSession } = await import("@/lib/auth/session"));
    ({ POST: loginPost } = await import("@/app/api/auth/login/route"));
    ({ POST: logoutPost } = await import("@/app/api/auth/logout/route"));
    ({ listUsers } = await import("@/services/users"));
    ({ listAvailableClientContexts } = await import("@/services/client-context"));

    const { hashPassword } = await import("@/lib/auth/password");
    const migration = readFileSync(
      new URL("../../src/db/migrations/0000_adorable_sleeper.sql", import.meta.url),
      "utf8",
    ).replaceAll("--> statement-breakpoint", "");
    dbModule.sqlite.exec(migration);

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const passwordHash = await hashPassword("correct-password");
    const internalUserId = crypto.randomUUID();
    const clientUserId = crypto.randomUUID();
    const disabledUserId = crypto.randomUUID();
    const providerRoleId = crypto.randomUUID();
    const clientRoleId = crypto.randomUUID();
    internalSessionId = crypto.randomUUID();
    clientSessionId = crypto.randomUUID();
    disabledSessionId = crypto.randomUUID();
    clientAId = crypto.randomUUID();
    clientBId = crypto.randomUUID();

    const dashboardPermissionId = crypto.randomUUID();
    const clientsPermissionId = crypto.randomUUID();
    const hrmPermissionId = crypto.randomUUID();
    const usersViewPermissionId = crypto.randomUUID();
    const adminConsolePermissionId = crypto.randomUUID();

    await dbModule.db.insert(schema.users).values([
      {
        id: internalUserId,
        username: "active-user",
        email: "active-user@example.com",
        displayName: "Active User",
        accountType: "internal",
        status: "active",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: clientUserId,
        username: "client-user",
        email: "client-user@example.com",
        displayName: "Client User",
        accountType: "client",
        status: "active",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: disabledUserId,
        username: "disabled-user",
        email: "disabled-user@example.com",
        displayName: "Disabled User",
        accountType: "internal",
        status: "disabled",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.roles).values([
      {
        id: providerRoleId,
        key: "boundary_provider",
        name: "Boundary Provider",
        audience: "internal",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: clientRoleId,
        key: "boundary_client",
        name: "Boundary Client",
        audience: "client",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.permissions).values([
      {
        id: dashboardPermissionId,
        resource: "dashboard",
        action: "view",
        createdAt: now,
      },
      {
        id: clientsPermissionId,
        resource: "clients",
        action: "view",
        createdAt: now,
      },
      {
        id: hrmPermissionId,
        resource: "hrm",
        action: "view",
        createdAt: now,
      },
      {
        id: usersViewPermissionId,
        resource: "users",
        action: "view",
        createdAt: now,
      },
      {
        id: adminConsolePermissionId,
        resource: "admin_console",
        action: "view",
        createdAt: now,
      },
    ]);
    await dbModule.db.insert(schema.rolePermissions).values([
      {
        roleId: providerRoleId,
        permissionId: dashboardPermissionId,
        createdAt: now,
      },
      {
        roleId: providerRoleId,
        permissionId: hrmPermissionId,
        createdAt: now,
      },
      {
        roleId: providerRoleId,
        permissionId: adminConsolePermissionId,
        createdAt: now,
      },
      {
        roleId: clientRoleId,
        permissionId: dashboardPermissionId,
        createdAt: now,
      },
      {
        roleId: clientRoleId,
        permissionId: clientsPermissionId,
        createdAt: now,
      },
      {
        roleId: clientRoleId,
        permissionId: hrmPermissionId,
        createdAt: now,
      },
    ]);
    await dbModule.db.insert(schema.internalUserRoles).values([
      { userId: internalUserId, roleId: providerRoleId, assignedAt: now },
      { userId: disabledUserId, roleId: providerRoleId, assignedAt: now },
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
        countryCode: "IN",
        clientType: "Test",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await dbModule.db.insert(schema.employeeClientAssignments).values({
      userId: internalUserId,
      clientId: clientAId,
      roleId: clientRoleId,
      status: "active",
      assignedAt: now,
    });
    await dbModule.db.insert(schema.clientMemberships).values({
      userId: clientUserId,
      clientId: clientAId,
      roleId: clientRoleId,
      status: "active",
      joinedAt: now,
    });
    await dbModule.db.insert(schema.sessions).values([
      {
        id: internalSessionId,
        userId: internalUserId,
        tokenHash: "boundary-internal-token",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
      {
        id: clientSessionId,
        userId: clientUserId,
        tokenHash: "boundary-client-token",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
      {
        id: disabledSessionId,
        userId: disabledUserId,
        tokenHash: "boundary-disabled-token",
        expiresAt,
        lastSeenAt: now,
        createdAt: now,
      },
    ]);
  });

  afterAll(() => {
    dbModule.sqlite.close();
  });

  it("accepts valid login details and issues a secure server session cookie", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ username: "ACTIVE-USER", password: "correct-password" }),
      }),
    );
    const setCookie = response.headers.get("set-cookie") ?? "";
    const token = setCookie.match(/service_portal_session=([^;]+)/)?.[1];

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
    expect(setCookie).toContain("portal_client_context=");
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(token).toBeTruthy();
    await expect(findSession(token!)).resolves.toMatchObject({
      user: { username: "active-user" },
    });
  });

  it("returns the same denial for invalid credentials and disabled accounts", async () => {
    const attempts = [
      { username: "active-user", password: "wrong-password" },
      { username: "missing-user", password: "wrong-password" },
      { username: "disabled-user", password: "correct-password" },
    ];

    for (const credentials of attempts) {
      const response = await loginPost(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(credentials),
        }),
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid username or password.",
      });
    }
  });

  it("rejects malformed direct login requests before database access", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ username: "", password: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("allows only the exact active client assignment or membership", async () => {
    await expect(
      authorize({
        sessionId: internalSessionId,
        clientId: clientAId,
        resource: "hrm",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: true, reason: "role_permission" });
    await expect(
      authorize({
        sessionId: internalSessionId,
        clientId: clientBId,
        resource: "hrm",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "invalid_client_scope" });
    await expect(
      authorize({
        sessionId: clientSessionId,
        clientId: clientAId,
        resource: "hrm",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: true, reason: "role_permission" });
    await expect(
      authorize({
        sessionId: clientSessionId,
        clientId: clientBId,
        resource: "hrm",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "invalid_client_scope" });
  });

  it("keeps client users in their company portal without exposing the Clients page", async () => {
    await expect(
      listAvailableClientContexts({ sessionId: clientSessionId }),
    ).resolves.toEqual([{ id: clientAId, code: "CLIENT-A", name: "Client A" }]);
    await expect(
      authorize({
        sessionId: clientSessionId,
        clientId: clientAId,
        resource: "clients",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "invalid_client_scope" });
  });

  it("lets authorized administrators preview every module shell without weakening data scope", async () => {
    await expect(
      authorize({
        sessionId: internalSessionId,
        clientId: clientBId,
        resource: "hrm",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "invalid_client_scope" });
    await expect(
      authorizePortalPageView({
        sessionId: internalSessionId,
        clientId: null,
        resource: "hrm",
      }),
    ).resolves.toMatchObject({ allowed: true, reason: "role_permission" });
    await expect(
      authorizePortalPageView({
        sessionId: internalSessionId,
        clientId: clientBId,
        resource: "hrm",
      }),
    ).resolves.toMatchObject({ allowed: true, reason: "role_permission" });
    await expect(
      authorizePortalPageView({
        sessionId: clientSessionId,
        clientId: null,
        resource: "hrm",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "invalid_client_scope" });
  });

  it("denies disabled and invalid sessions before permission evaluation", async () => {
    await expect(
      authorize({
        sessionId: disabledSessionId,
        clientId: null,
        resource: "dashboard",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "disabled_user" });
    await expect(
      authorize({
        sessionId: crypto.randomUUID(),
        clientId: null,
        resource: "dashboard",
        action: "view",
      }),
    ).resolves.toMatchObject({ allowed: false, reason: "invalid_session" });
  });

  it("independently denies direct service access without the required permission", async () => {
    await expect(
      listUsers({ sessionId: internalSessionId, search: "", limit: 20, offset: 0 }),
    ).rejects.toMatchObject({
      status: 403,
      decision: { reason: "missing_permission" },
    });
  });

  it("invalidates the exact session through the logout Route Handler", async () => {
    const loginResponse = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ username: "active-user", password: "correct-password" }),
      }),
    );
    const token = loginResponse.headers
      .get("set-cookie")
      ?.match(/service_portal_session=([^;]+)/)?.[1];
    const response = await logoutPost(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie: `service_portal_session=${token}` },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/login");
    expect(response.headers.get("set-cookie")).toContain("portal_client_context=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    await expect(findSession(token!)).resolves.toBeNull();
  });

  it("records successful and denied authentication and authorization events", async () => {
    const auditRows = await dbModule.db.select().from(schema.auditLogs);
    const eventTypes = auditRows.map(({ eventType }) => eventType);
    const denialReasons = auditRows
      .filter(({ outcome }) => outcome === "denied")
      .map(({ reason }) => reason);

    expect(eventTypes).toContain("auth.login");
    expect(eventTypes).toContain("auth.logout");
    expect(eventTypes).toContain("authorization.denied");
    expect(denialReasons).toContain("invalid_client_scope");
    expect(denialReasons).toContain("disabled_user");
    expect(denialReasons).toContain("invalid_session");
    expect(denialReasons).toContain("missing_permission");
  });
});
