import { eq } from "drizzle-orm";

import { hashPassword } from "../lib/auth/password";
import { permissionDefinitions, type PermissionKey } from "../lib/rbac/permissions";
import { INITIAL_ROLE_PERMISSION_MATRIX } from "../lib/rbac/role-permission-matrix";
import {
  ROLE_DEFINITIONS,
  ROLE_KEYS,
  roleKeys,
  type RoleKey,
} from "../lib/rbac/roles";
import { db, sqlite } from "./index";
import {
  internalUserRoles,
  permissions,
  rolePermissions,
  roles,
  users,
} from "./schema";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

async function seedInitialAccess() {
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
    .limit(1);
  const adminPasswordHash = existingAdmin
    ? null
    : await hashPassword(ADMIN_PASSWORD);
  const now = new Date().toISOString();

  const result = db.transaction((transaction) => {
    const roleIds = new Map(
      transaction
        .select({ id: roles.id, key: roles.key })
        .from(roles)
        .all()
        .map((role) => [role.key, role.id]),
    );
    let createdRoles = 0;

    for (const roleKey of roleKeys) {
      if (roleIds.has(roleKey)) {
        continue;
      }

      const roleId = crypto.randomUUID();
      const definition = ROLE_DEFINITIONS[roleKey];

      transaction
        .insert(roles)
        .values({
          id: roleId,
          key: roleKey,
          name: definition.name,
          audience: definition.audience,
          description: definition.description,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      roleIds.set(roleKey, roleId);
      createdRoles += 1;
    }

    const permissionIds = new Map(
      transaction
        .select({
          id: permissions.id,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(permissions)
        .all()
        .map((permission) => [
          `${permission.resource}:${permission.action}`,
          permission.id,
        ]),
    );
    let createdPermissions = 0;

    for (const definition of permissionDefinitions) {
      if (permissionIds.has(definition.key)) {
        continue;
      }

      const permissionId = crypto.randomUUID();
      transaction
        .insert(permissions)
        .values({
          id: permissionId,
          resource: definition.resource,
          action: definition.action,
          description: `${definition.action} access for ${definition.resource}`,
          createdAt: now,
        })
        .run();
      permissionIds.set(definition.key, permissionId);
      createdPermissions += 1;
    }

    const existingRolePermissions = new Set(
      transaction
        .select({
          roleId: rolePermissions.roleId,
          permissionId: rolePermissions.permissionId,
        })
        .from(rolePermissions)
        .all()
        .map(({ roleId, permissionId }) => `${roleId}:${permissionId}`),
    );
    let createdRolePermissions = 0;

    for (const [roleKey, permissionKeys] of Object.entries(
      INITIAL_ROLE_PERMISSION_MATRIX,
    ) as [RoleKey, readonly PermissionKey[]][]) {
      const roleId = roleIds.get(roleKey);

      if (!roleId) {
        throw new Error(`Missing seeded role: ${roleKey}`);
      }

      for (const permissionKey of permissionKeys) {
        const permissionId = permissionIds.get(permissionKey);

        if (!permissionId) {
          throw new Error(`Missing seeded permission: ${permissionKey}`);
        }

        const relationshipKey = `${roleId}:${permissionId}`;
        if (existingRolePermissions.has(relationshipKey)) {
          continue;
        }

        transaction
          .insert(rolePermissions)
          .values({
            roleId,
            permissionId,
            createdAt: now,
          })
          .run();
        existingRolePermissions.add(relationshipKey);
        createdRolePermissions += 1;
      }
    }

    let adminUserId = existingAdmin?.id;
    let createdAdmin = false;

    if (!adminUserId) {
      if (!adminPasswordHash) {
        throw new Error("The local Admin password hash was not created.");
      }

      adminUserId = crypto.randomUUID();
      transaction
        .insert(users)
        .values({
          id: adminUserId,
          username: ADMIN_USERNAME,
          email: "admin@localhost.invalid",
          displayName: "Administrator",
          accountType: "internal",
          status: "active",
          passwordHash: adminPasswordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      createdAdmin = true;
    }

    const [existingAdminRole] = transaction
      .select({ roleId: internalUserRoles.roleId })
      .from(internalUserRoles)
      .where(eq(internalUserRoles.userId, adminUserId))
      .limit(1)
      .all();

    if (!existingAdminRole) {
      const adminRoleId = roleIds.get(ROLE_KEYS.INTERNAL_ADMIN);

      if (!adminRoleId) {
        throw new Error("The internal Admin role was not seeded.");
      }

      transaction
        .insert(internalUserRoles)
        .values({
          userId: adminUserId,
          roleId: adminRoleId,
          assignedByUserId: adminUserId,
          assignedAt: now,
        })
        .run();
    }

    return {
      createdRoles,
      createdPermissions,
      createdRolePermissions,
      createdAdmin,
    };
  });

  console.info(
    `Seed complete: ${result.createdRoles} roles, ${result.createdPermissions} permissions, and ${result.createdRolePermissions} role assignments added.`,
  );
  console.info(
    result.createdAdmin
      ? "Created local Admin account (username: admin, password: admin)."
      : "Local Admin already exists; its password and role were not changed.",
  );
}

seedInitialAccess()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    sqlite.close();
  });
