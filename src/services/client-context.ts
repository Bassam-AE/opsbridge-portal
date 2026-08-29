import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clientMemberships,
  clients,
  employeeClientAssignments,
} from "@/db/schema";
import type { ClientContextOption } from "@/lib/client-context";
import { ACTIONS } from "@/lib/rbac/actions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import {
  clientContextInputSchema,
  clientContextListInputSchema,
} from "@/lib/validation/assignments";
import { ServiceMutationError } from "@/services/errors";
import { requireValidServiceIdentity } from "@/services/security";

export async function listAvailableClientContexts(
  rawInput: unknown,
): Promise<ClientContextOption[]> {
  const input = clientContextListInputSchema.parse(rawInput);
  const identity = await requireValidServiceIdentity(input.sessionId);

  if (identity.accountType === "internal") {
    await requirePermissionForSession(input.sessionId, {
      clientId: null,
      resource: RESOURCES.CLIENTS,
      action: ACTIONS.VIEW,
    });

    return db
      .select({ id: clients.id, code: clients.clientCode, name: clients.name })
      .from(employeeClientAssignments)
      .innerJoin(clients, eq(employeeClientAssignments.clientId, clients.id))
      .where(
        and(
          eq(employeeClientAssignments.userId, identity.userId),
          eq(employeeClientAssignments.status, "active"),
          eq(clients.status, "active"),
        ),
      )
      .orderBy(asc(clients.name));
  }

  const contexts = await db
    .select({ id: clients.id, code: clients.clientCode, name: clients.name })
    .from(clientMemberships)
    .innerJoin(clients, eq(clientMemberships.clientId, clients.id))
    .where(
      and(
        eq(clientMemberships.userId, identity.userId),
        eq(clientMemberships.status, "active"),
        eq(clients.status, "active"),
      ),
    )
    .orderBy(asc(clients.name));

  if (contexts[0]) {
    await requirePermissionForSession(input.sessionId, {
      clientId: contexts[0].id,
      resource: RESOURCES.DASHBOARD,
      action: ACTIONS.VIEW,
    });
  }

  return contexts;
}

export async function validateClientContextSelection(rawInput: unknown) {
  const input = clientContextInputSchema.parse(rawInput);
  const identity = await requireValidServiceIdentity(input.sessionId);
  const contexts = await listAvailableClientContexts({ sessionId: input.sessionId });

  if (identity.accountType === "client") {
    if (!input.clientId || contexts[0]?.id !== input.clientId) {
      throw new ServiceMutationError(
        "invalid_relationship",
        "Client users must remain in their own company context.",
      );
    }
    return input.clientId;
  }

  if (input.clientId && !contexts.some(({ id }) => id === input.clientId)) {
    throw new ServiceMutationError(
      "invalid_relationship",
      "You do not have an active assignment for that client.",
    );
  }

  return input.clientId;
}
