export const RESOURCES = {
  DASHBOARD: "dashboard",
  CLIENTS: "clients",
  CRM: "crm",
  HRM: "hrm",
  VMS: "vms",
  BMS: "bms",
  VAULT: "vault",
  INTERNAL_CHAT: "internal_chat",
  MARKETING: "marketing",
  ACCOUNTS: "accounts",
  ADMIN_CONSOLE: "admin_console",
  USERS: "users",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  CLIENT_ASSIGNMENTS: "client_assignments",
  USER_PERMISSION_OVERRIDES: "user_permission_overrides",
  AUDIT_LOGS: "audit_logs",
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
export type ResourceScope = "provider" | "client" | "contextual";

export type ResourceDefinition = {
  label: string;
  scope: ResourceScope;
};

export const RESOURCE_DEFINITIONS = {
  [RESOURCES.DASHBOARD]: { label: "Dashboard", scope: "contextual" },
  [RESOURCES.CLIENTS]: { label: "Clients", scope: "provider" },
  [RESOURCES.CRM]: { label: "CRM", scope: "client" },
  [RESOURCES.HRM]: { label: "HRM", scope: "client" },
  [RESOURCES.VMS]: { label: "VMS", scope: "client" },
  [RESOURCES.BMS]: { label: "BMS", scope: "client" },
  [RESOURCES.VAULT]: { label: "Vault", scope: "client" },
  [RESOURCES.INTERNAL_CHAT]: { label: "Internal Chat", scope: "provider" },
  [RESOURCES.MARKETING]: { label: "Marketing", scope: "client" },
  [RESOURCES.ACCOUNTS]: { label: "Accounts", scope: "client" },
  [RESOURCES.ADMIN_CONSOLE]: { label: "Admin Console", scope: "provider" },
  [RESOURCES.USERS]: { label: "Users", scope: "contextual" },
  [RESOURCES.ROLES]: { label: "Roles", scope: "provider" },
  [RESOURCES.PERMISSIONS]: { label: "Permissions", scope: "provider" },
  [RESOURCES.CLIENT_ASSIGNMENTS]: {
    label: "Client Assignments",
    scope: "provider",
  },
  [RESOURCES.USER_PERMISSION_OVERRIDES]: {
    label: "User Permission Overrides",
    scope: "provider",
  },
  [RESOURCES.AUDIT_LOGS]: { label: "Audit Logs", scope: "provider" },
} as const satisfies Record<Resource, ResourceDefinition>;

export const resourceValues = Object.values(RESOURCES) as readonly Resource[];

export function isResource(value: string): value is Resource {
  return (resourceValues as readonly string[]).includes(value);
}
