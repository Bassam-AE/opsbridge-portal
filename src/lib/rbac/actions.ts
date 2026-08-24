export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  APPROVE: "approve",
  EXPORT: "export",
  MANAGE_ACCESS: "manage_access",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export const actionValues = Object.values(ACTIONS) as readonly Action[];

export function isAction(value: string): value is Action {
  return (actionValues as readonly string[]).includes(value);
}
