import { and, eq } from "drizzle-orm";

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
  clientMemberships,
  clients,
  employeeClientAssignments,
  internalUserRoles,
  permissions,
  rolePermissions,
  roles,
  userPermissionOverrides,
  users,
} from "./schema";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";
const BLINDLY_USERNAME = "blindly";
const BLINDLY_PASSWORD = "blindly";
const COMPANY_USERNAME = "company";
const COMPANY_PASSWORD = "company";
const DEMO_CLIENT_CODE = "COMPANY";

async function seedInitialAccess() {
  const [existingAdmin] = await db
    .select({ id: users.id, accountType: users.accountType })
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
    .limit(1);
  const [existingBlindly] = await db
    .select({ id: users.id, accountType: users.accountType })
    .from(users)
    .where(eq(users.username, BLINDLY_USERNAME))
    .limit(1);
  const [existingCompany] = await db
    .select({ id: users.id, accountType: users.accountType })
    .from(users)
    .where(eq(users.username, COMPANY_USERNAME))
    .limit(1);

  if (existingBlindly && existingBlindly.accountType !== "internal") {
    throw new Error("The existing blindly user is not an internal account.");
  }

  if (existingCompany && existingCompany.accountType !== "client") {
    throw new Error("The existing company user is not a client account.");
  }

  const adminPasswordHash = existingAdmin
    ? null
    : await hashPassword(ADMIN_PASSWORD);
  const [blindlyPasswordHash, companyPasswordHash] = await Promise.all([
    existingBlindly ? Promise.resolve(null) : hashPassword(BLINDLY_PASSWORD),
    existingCompany ? Promise.resolve(null) : hashPassword(COMPANY_PASSWORD),
  ]);
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

    const [existingDemoClient] = transaction
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.clientCode, DEMO_CLIENT_CODE))
      .limit(1)
      .all();
    let demoClientId = existingDemoClient?.id;
    let createdDemoClient = false;

    if (!demoClientId) {
      demoClientId = crypto.randomUUID();
      transaction
        .insert(clients)
        .values({
          id: demoClientId,
          clientCode: DEMO_CLIENT_CODE,
          name: "Client Company",
          countryCode: "IN",
          clientType: "Demo",
          status: "active",
          createdAt: now,
          updatedAt: now,
        })
        .run();
      createdDemoClient = true;
    }

    let blindlyUserId = existingBlindly?.id;
    let createdBlindly = false;

    if (!blindlyUserId) {
      if (!blindlyPasswordHash) {
        throw new Error("The local Blindly Digital password hash was not created.");
      }

      blindlyUserId = crypto.randomUUID();
      transaction
        .insert(users)
        .values({
          id: blindlyUserId,
          username: BLINDLY_USERNAME,
          email: "blindly@localhost.invalid",
          displayName: "Blindly Digital Employee",
          accountType: "internal",
          status: "active",
          passwordHash: blindlyPasswordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      createdBlindly = true;
    }

    const internalEmployeeRoleId = roleIds.get(ROLE_KEYS.INTERNAL_SME);
    if (!internalEmployeeRoleId) {
      throw new Error("The internal SME role was not seeded.");
    }

    const [existingBlindlyRole] = transaction
      .select({ roleId: internalUserRoles.roleId })
      .from(internalUserRoles)
      .where(eq(internalUserRoles.userId, blindlyUserId))
      .limit(1)
      .all();

    if (!existingBlindlyRole) {
      transaction
        .insert(internalUserRoles)
        .values({
          userId: blindlyUserId,
          roleId: internalEmployeeRoleId,
          assignedByUserId: adminUserId,
          assignedAt: now,
        })
        .run();
    }

    const [existingBlindlyAssignment] = transaction
      .select({ id: employeeClientAssignments.id })
      .from(employeeClientAssignments)
      .where(
        and(
          eq(employeeClientAssignments.userId, blindlyUserId),
          eq(employeeClientAssignments.clientId, demoClientId),
        ),
      )
      .limit(1)
      .all();

    if (!existingBlindlyAssignment) {
      transaction
        .insert(employeeClientAssignments)
        .values({
          userId: blindlyUserId,
          clientId: demoClientId,
          roleId: internalEmployeeRoleId,
          status: "active",
          assignedByUserId: adminUserId,
          assignedAt: now,
        })
        .run();
    }

    let createdBlindlyRestrictions = 0;
    for (const permissionKey of ["bms:view", "marketing:view"] as const) {
      const permissionId = permissionIds.get(permissionKey);
      if (!permissionId) {
        throw new Error(`Missing seeded permission: ${permissionKey}`);
      }

      const [existingOverride] = transaction
        .select({ id: userPermissionOverrides.id })
        .from(userPermissionOverrides)
        .where(
          and(
            eq(userPermissionOverrides.userId, blindlyUserId),
            eq(userPermissionOverrides.clientId, demoClientId),
            eq(userPermissionOverrides.permissionId, permissionId),
          ),
        )
        .limit(1)
        .all();

      if (existingOverride) {
        continue;
      }

      transaction
        .insert(userPermissionOverrides)
        .values({
          id: crypto.randomUUID(),
          userId: blindlyUserId,
          clientId: demoClientId,
          permissionId,
          effect: "restriction",
          reason: "Limit the demo employee to the approved company modules.",
          createdByUserId: adminUserId,
          createdAt: now,
        })
        .run();
      createdBlindlyRestrictions += 1;
    }

    let companyUserId = existingCompany?.id;
    let createdCompany = false;

    if (!companyUserId) {
      if (!companyPasswordHash) {
        throw new Error("The local client-company password hash was not created.");
      }

      companyUserId = crypto.randomUUID();
      transaction
        .insert(users)
        .values({
          id: companyUserId,
          username: COMPANY_USERNAME,
          email: "company@localhost.invalid",
          displayName: "Client Company Employee",
          accountType: "client",
          status: "active",
          passwordHash: companyPasswordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      createdCompany = true;
    }

    const clientOwnerRoleId = roleIds.get(ROLE_KEYS.CLIENT_OWNER);
    if (!clientOwnerRoleId) {
      throw new Error("The client Owner role was not seeded.");
    }

    const [existingCompanyMembership] = transaction
      .select({ id: clientMemberships.id })
      .from(clientMemberships)
      .where(eq(clientMemberships.userId, companyUserId))
      .limit(1)
      .all();

    if (!existingCompanyMembership) {
      transaction
        .insert(clientMemberships)
        .values({
          userId: companyUserId,
          clientId: demoClientId,
          roleId: clientOwnerRoleId,
          status: "active",
          assignedByUserId: adminUserId,
          joinedAt: now,
        })
        .run();
    }

    return {
      createdRoles,
      createdPermissions,
      createdRolePermissions,
      createdAdmin,
      createdDemoClient,
      createdBlindly,
      createdBlindlyRestrictions,
      createdCompany,
    };
  });

  console.info(
    `Seed complete: ${result.createdRoles} roles, ${result.createdPermissions} permissions, and ${result.createdRolePermissions} role assignments added.`,
  );
  console.info(
    result.createdBlindlyRestrictions > 0
      ? `Added ${result.createdBlindlyRestrictions} company-module restrictions for the Blindly Digital employee.`
      : "Blindly Digital employee module restrictions already exist; they were not changed.",
  );
  console.info(
    result.createdAdmin
      ? "Created local Admin account (username: admin, password: admin)."
      : "Local Admin already exists; its password and role were not changed.",
  );
  console.info(
    result.createdDemoClient
      ? "Created demo client company (code: COMPANY)."
      : "Demo client company already exists; it was not changed.",
  );
  console.info(
    result.createdBlindly
      ? "Created Blindly Digital employee account (username: blindly, password: blindly)."
      : "Blindly Digital employee already exists; its password and access were not changed.",
  );
  console.info(
    result.createdCompany
      ? "Created client-company account (username: company, password: company)."
      : "Client-company account already exists; its password and access were not changed.",
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
