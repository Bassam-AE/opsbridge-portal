import { ACTIONS, type Action, isAction } from "./actions";
import { isResource, RESOURCES, type Resource } from "./resources";

export const RESOURCE_ACTIONS = {
  [RESOURCES.DASHBOARD]: [ACTIONS.VIEW],
  [RESOURCES.CLIENTS]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.CRM]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.HRM]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.VMS]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.BMS]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.VAULT]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.INTERNAL_CHAT]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
  ],
  [RESOURCES.MARKETING]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.ACCOUNTS]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE,
    ACTIONS.EXPORT,
  ],
  [RESOURCES.ADMIN_CONSOLE]: [ACTIONS.VIEW, ACTIONS.MANAGE_ACCESS],
  [RESOURCES.USERS]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.MANAGE_ACCESS,
  ],
  [RESOURCES.ROLES]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.MANAGE_ACCESS,
  ],
  [RESOURCES.PERMISSIONS]: [ACTIONS.VIEW],
  [RESOURCES.CLIENT_ASSIGNMENTS]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.MANAGE_ACCESS,
  ],
  [RESOURCES.USER_PERMISSION_OVERRIDES]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.MANAGE_ACCESS,
  ],
  [RESOURCES.AUDIT_LOGS]: [ACTIONS.VIEW, ACTIONS.EXPORT],
} as const satisfies Record<Resource, readonly Action[]>;

type ResourceActions = typeof RESOURCE_ACTIONS;

export type PermissionKey = {
  [CurrentResource in keyof ResourceActions]: `${CurrentResource & string}:${ResourceActions[CurrentResource][number]}`;
}[keyof ResourceActions];

export type PermissionDefinition = {
  key: PermissionKey;
  resource: Resource;
  action: Action;
};

export const permissionDefinitions: readonly PermissionDefinition[] = (
  Object.entries(RESOURCE_ACTIONS) as [Resource, readonly Action[]][]
).flatMap(([resource, actions]) =>
  actions.map((action) => ({
    key: `${resource}:${action}` as PermissionKey,
    resource,
    action,
  })),
);

export function createPermissionKey<CurrentResource extends Resource>(
  resource: CurrentResource,
  action: ResourceActions[CurrentResource][number],
): PermissionKey {
  return `${resource}:${action}` as PermissionKey;
}

export function isPermissionPair(resource: string, action: string): boolean {
  if (!isResource(resource) || !isAction(action)) {
    return false;
  }

  return (RESOURCE_ACTIONS[resource] as readonly Action[]).includes(action);
}
