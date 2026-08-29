import { z } from "zod";

import { serviceSessionSchema } from "@/lib/validation/access";

const identifierSchema = z.string().uuid("Select a valid record.");
const optionalClientIdSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  identifierSchema.nullable(),
);
function normalizeExpiryInput(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00.000Z`
    : trimmed;
}

const expirySchema = z
  .preprocess(
    normalizeExpiryInput,
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid expiry date.")
      .transform((value) => new Date(value).toISOString())
      .nullable(),
  )
  .refine(
    (value) => value === null || value > new Date().toISOString(),
    "The expiry date must be in the future.",
  );

export const replaceRolePermissionsInputSchema = z.object({
  sessionId: serviceSessionSchema,
  roleId: identifierSchema,
  permissionIds: z.array(identifierSchema).max(100).transform((values) => [...new Set(values)]),
});

export const createUserPermissionOverrideInputSchema = z.object({
  sessionId: serviceSessionSchema,
  userId: identifierSchema,
  clientId: optionalClientIdSchema,
  permissionId: identifierSchema,
  effect: z.enum(["grant", "restriction"]),
  reason: z.string().trim().min(3).max(300),
  expiresAt: expirySchema,
});

export const updateUserPermissionOverrideInputSchema = z.object({
  sessionId: serviceSessionSchema,
  overrideId: identifierSchema,
  effect: z.enum(["grant", "restriction"]),
  reason: z.string().trim().min(3).max(300),
  expiresAt: expirySchema,
});

export const revokeUserPermissionOverrideInputSchema = z.object({
  sessionId: serviceSessionSchema,
  overrideId: identifierSchema,
});
