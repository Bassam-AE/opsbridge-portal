import { z } from "zod";

import { serviceSessionSchema } from "@/lib/validation/access";

const assignmentIdentifiers = {
  sessionId: serviceSessionSchema,
  userId: z.string().uuid("Select a valid user."),
  clientId: z.string().uuid("Select a valid client company."),
  roleId: z.string().uuid("Select a valid role."),
};

export const createEmployeeAssignmentInputSchema = z.object(assignmentIdentifiers);

export const updateEmployeeAssignmentInputSchema = z.object({
  sessionId: serviceSessionSchema,
  assignmentId: z.string().uuid("Invalid assignment identifier."),
  roleId: assignmentIdentifiers.roleId,
});

export const setEmployeeAssignmentStatusInputSchema = z.object({
  sessionId: serviceSessionSchema,
  assignmentId: z.string().uuid("Invalid assignment identifier."),
  status: z.enum(["active", "inactive"]),
});

export const createClientMembershipInputSchema = z.object(assignmentIdentifiers);

export const updateClientMembershipInputSchema = z.object({
  sessionId: serviceSessionSchema,
  membershipId: z.string().uuid("Invalid membership identifier."),
  clientId: assignmentIdentifiers.clientId,
  roleId: assignmentIdentifiers.roleId,
});

export const setClientMembershipStatusInputSchema = z.object({
  sessionId: serviceSessionSchema,
  membershipId: z.string().uuid("Invalid membership identifier."),
  status: z.enum(["active", "inactive"]),
});

export const clientContextInputSchema = z.object({
  sessionId: serviceSessionSchema,
  clientId: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().uuid("Invalid client context.").nullable(),
  ),
});

export const clientContextListInputSchema = z.object({
  sessionId: serviceSessionSchema,
});
