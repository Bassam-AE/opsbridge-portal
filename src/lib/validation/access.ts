import { z } from "zod";

export const serviceSessionSchema = z.string().uuid("Invalid server session identifier.");

export const paginatedListInputSchema = z.object({
  sessionId: serviceSessionSchema,
  search: z.string().trim().max(100).default(""),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const accessLogListInputSchema = z.object({
  sessionId: serviceSessionSchema,
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const optionalUsernameSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(64, "Username must be at most 64 characters.")
    .regex(
      /^[a-z0-9._-]+$/,
      "Username can contain only lowercase letters, numbers, dots, underscores, and hyphens.",
    )
    .optional(),
);

const optionalClientIdSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid("Select a valid client company.").optional(),
);

export const createUserInputSchema = z
  .object({
    sessionId: serviceSessionSchema,
    displayName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    username: optionalUsernameSchema,
    accountType: z.enum(["internal", "client"]),
    roleId: z.string().uuid("Select a valid role."),
    clientId: optionalClientIdSchema,
  })
  .superRefine((input, context) => {
    if (input.accountType === "client" && !input.clientId) {
      context.addIssue({
        code: "custom",
        path: ["clientId"],
        message: "A client company is required for a client user.",
      });
    }

    if (input.accountType === "internal" && input.clientId) {
      context.addIssue({
        code: "custom",
        path: ["clientId"],
        message: "Internal users cannot have a client membership.",
      });
    }
  });

export const createCompanyUserInputSchema = z.object({
  sessionId: serviceSessionSchema,
  displayName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  username: optionalUsernameSchema,
});

export const setUserStatusInputSchema = z.object({
  sessionId: serviceSessionSchema,
  targetUserId: z.string().uuid("Invalid user identifier."),
  status: z.enum(["active", "disabled"]),
});

const clientFields = {
  clientCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Client ID can contain letters, numbers, underscores, and hyphens."),
  name: z.string().trim().min(2).max(120),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use a two-letter country code."),
  clientType: z.string().trim().min(2).max(80),
};

export const createClientInputSchema = z.object({
  sessionId: serviceSessionSchema,
  ...clientFields,
});

export const updateClientInputSchema = z.object({
  sessionId: serviceSessionSchema,
  clientId: z.string().uuid("Invalid client identifier."),
  ...clientFields,
});

export const setClientStatusInputSchema = z.object({
  sessionId: serviceSessionSchema,
  clientId: z.string().uuid("Invalid client identifier."),
  status: z.enum(["active", "inactive"]),
});

export const clientRecordInputSchema = z.object({
  sessionId: serviceSessionSchema,
  clientId: z.string().uuid("Invalid client identifier."),
});

export type PaginatedListInput = z.input<typeof paginatedListInputSchema>;
export type AccessLogListInput = z.input<typeof accessLogListInputSchema>;
export type CreateUserInput = z.input<typeof createUserInputSchema>;
export type SetUserStatusInput = z.input<typeof setUserStatusInputSchema>;
export type CreateClientInput = z.input<typeof createClientInputSchema>;
export type UpdateClientInput = z.input<typeof updateClientInputSchema>;
export type SetClientStatusInput = z.input<typeof setClientStatusInputSchema>;
