import { RESOURCE_DEFINITIONS, RESOURCES, type Resource } from "./resources";

export type AccessAudience = "internal" | "client";

const clientPortalResources = new Set<Resource>([
  RESOURCES.DASHBOARD,
  RESOURCES.CRM,
  RESOURCES.HRM,
  RESOURCES.VMS,
  RESOURCES.VAULT,
  RESOURCES.ACCOUNTS,
  RESOURCES.USERS,
]);

export function accountTypeCanAccessResource(
  accountType: AccessAudience,
  resource: Resource,
): boolean {
  return accountType === "internal" || clientPortalResources.has(resource);
}

export function roleAudienceCanReceiveResource(
  audience: AccessAudience,
  resource: Resource,
): boolean {
  return accountTypeCanAccessResource(audience, resource);
}

export function overrideScopeMatchesAccount(
  accountType: AccessAudience,
  resource: Resource,
  clientId: string | null,
): boolean {
  if (!accountTypeCanAccessResource(accountType, resource)) {
    return false;
  }

  const scope = RESOURCE_DEFINITIONS[resource].scope;

  if (scope === "provider") {
    return accountType === "internal" && clientId === null;
  }

  if (scope === "client") {
    return clientId !== null;
  }

  return accountType === "internal" || clientId !== null;
}
