export const ROLE_KEYS = {
  INTERNAL_CEO_CTO: "internal_ceo_cto",
  INTERNAL_ADMIN: "internal_admin",
  INTERNAL_KEY_ACCOUNT_MANAGER: "internal_key_account_manager",
  INTERNAL_COMPANY_SECRETARY: "internal_company_secretary",
  INTERNAL_CA: "internal_ca",
  INTERNAL_ACCOUNTANT: "internal_accountant",
  INTERNAL_DESIGNER: "internal_designer",
  INTERNAL_SME: "internal_sme",
  INTERNAL_SALES: "internal_sales",
  CLIENT_OWNER: "client_owner",
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];
export type RoleAudience = "internal" | "client";

export type RoleDefinition = {
  name: string;
  audience: RoleAudience;
  description: string;
};

export const ROLE_DEFINITIONS = {
  [ROLE_KEYS.INTERNAL_CEO_CTO]: {
    name: "CEO/CTO",
    audience: "internal",
    description: "Executive access within valid provider and assigned-client scopes.",
  },
  [ROLE_KEYS.INTERNAL_ADMIN]: {
    name: "Admin",
    audience: "internal",
    description: "Access administration and operational access within valid scopes.",
  },
  [ROLE_KEYS.INTERNAL_KEY_ACCOUNT_MANAGER]: {
    name: "Key Account Manager",
    audience: "internal",
    description: "Client relationship management for assigned client companies.",
  },
  [ROLE_KEYS.INTERNAL_COMPANY_SECRETARY]: {
    name: "Company Secretary",
    audience: "internal",
    description: "Company records, compliance work, and controlled documents.",
  },
  [ROLE_KEYS.INTERNAL_CA]: {
    name: "CA",
    audience: "internal",
    description: "Financial review, approval, reporting, and supporting documents.",
  },
  [ROLE_KEYS.INTERNAL_ACCOUNTANT]: {
    name: "Accountant",
    audience: "internal",
    description: "Financial record entry, reporting, and supporting documents.",
  },
  [ROLE_KEYS.INTERNAL_DESIGNER]: {
    name: "Designer",
    audience: "internal",
    description: "Marketing assets and related client documents.",
  },
  [ROLE_KEYS.INTERNAL_SME]: {
    name: "SME",
    audience: "internal",
    description: "Cross-module subject-matter review for assigned clients.",
  },
  [ROLE_KEYS.INTERNAL_SALES]: {
    name: "Sales",
    audience: "internal",
    description: "Prospect, client, and CRM record management.",
  },
  [ROLE_KEYS.CLIENT_OWNER]: {
    name: "Owner",
    audience: "client",
    description: "Full operational access within the owner's own client company.",
  },
} as const satisfies Record<RoleKey, RoleDefinition>;

export const roleKeys = Object.values(ROLE_KEYS) as readonly RoleKey[];
