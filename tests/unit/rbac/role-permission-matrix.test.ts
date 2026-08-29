import { describe, expect, it } from "vitest";

import { permissionDefinitions } from "@/lib/rbac/permissions";
import { INITIAL_ROLE_PERMISSION_MATRIX } from "@/lib/rbac/role-permission-matrix";
import { ROLE_KEYS, roleKeys } from "@/lib/rbac/roles";

const privilegedRoleKeys = new Set<string>([
  ROLE_KEYS.INTERNAL_CEO_CTO,
  ROLE_KEYS.INTERNAL_ADMIN,
]);

describe("initial role-permission matrix", () => {
  it("defines every canonical role exactly once", () => {
    expect(Object.keys(INITIAL_ROLE_PERMISSION_MATRIX).sort()).toEqual(
      [...roleKeys].sort(),
    );
  });

  it("contains no duplicate permissions for a role", () => {
    for (const permissions of Object.values(INITIAL_ROLE_PERMISSION_MATRIX)) {
      expect(new Set(permissions).size).toBe(permissions.length);
    }
  });

  it("gives CEO/CTO and Admin the full canonical catalog", () => {
    const allPermissionKeys = permissionDefinitions.map(({ key }) => key).sort();

    expect([...INITIAL_ROLE_PERMISSION_MATRIX.internal_ceo_cto].sort()).toEqual(
      allPermissionKeys,
    );
    expect([...INITIAL_ROLE_PERMISSION_MATRIX.internal_admin].sort()).toEqual(
      allPermissionKeys,
    );
  });

  it("reserves Admin Console and access management for CEO/CTO and Admin", () => {
    for (const [roleKey, permissions] of Object.entries(
      INITIAL_ROLE_PERMISSION_MATRIX,
    )) {
      const hasAdminConsoleAccess = permissions.some((permission) =>
        permission.startsWith("admin_console:"),
      );
      const canManageAccess = permissions.some((permission) =>
        permission.endsWith(":manage_access"),
      );

      expect(hasAdminConsoleAccess).toBe(privilegedRoleKeys.has(roleKey));
      expect(canManageAccess).toBe(privilegedRoleKeys.has(roleKey));
    }
  });

  it("does not give the Client Owner provider-only permissions", () => {
    const ownerPermissions = INITIAL_ROLE_PERMISSION_MATRIX.client_owner;
    const providerPrefixes = [
      "internal_chat:",
      "admin_console:",
      "roles:",
      "permissions:",
      "client_assignments:",
      "user_permission_overrides:",
      "audit_logs:",
    ];

    expect(
      ownerPermissions.some((permission) =>
        providerPrefixes.some((prefix) => permission.startsWith(prefix)),
      ),
    ).toBe(false);
  });

  it("limits the Client Owner to the approved company portal modules", () => {
    const ownerResources = new Set(
      INITIAL_ROLE_PERMISSION_MATRIX.client_owner.map((permission) =>
        permission.slice(0, permission.indexOf(":")),
      ),
    );

    expect(ownerResources).toEqual(
      new Set(["dashboard", "users", "crm", "hrm", "vms", "vault", "accounts"]),
    );
  });

  it("gives client employees read-only access to approved company modules", () => {
    expect(INITIAL_ROLE_PERMISSION_MATRIX.client_employee).toEqual([
      "dashboard:view",
      "crm:view",
      "hrm:view",
      "vms:view",
      "vault:view",
      "accounts:view",
    ]);
  });
});
