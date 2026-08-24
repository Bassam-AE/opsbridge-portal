import { asc, count, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, clients } from "@/db/schema";
import { ACTIONS } from "@/lib/rbac/actions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import {
  createClientInputSchema,
  paginatedListInputSchema,
  setClientStatusInputSchema,
  updateClientInputSchema,
  type PaginatedListInput,
} from "@/lib/validation/access";
import {
  isUniqueConstraintError,
  ServiceMutationError,
} from "@/services/errors";
import { requireAuthorizedServiceActor } from "@/services/security";
import type { PaginatedResult } from "@/services/types";

export type ClientListItem = {
  id: string;
  clientCode: string;
  name: string;
  countryCode: string;
  clientType: string;
  status: "active" | "inactive";
  createdAt: string;
};

export async function listClients(
  rawInput: PaginatedListInput,
): Promise<PaginatedResult<ClientListItem>> {
  const input = paginatedListInputSchema.parse(rawInput);

  await requirePermissionForSession(input.sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENTS,
    action: ACTIONS.VIEW,
  });

  const searchFilter = input.search
    ? or(
        like(clients.clientCode, `%${input.search}%`),
        like(clients.name, `%${input.search}%`),
        like(clients.countryCode, `%${input.search}%`),
        like(clients.clientType, `%${input.search}%`),
      )
    : undefined;
  const itemQuery = db
    .select({
      id: clients.id,
      clientCode: clients.clientCode,
      name: clients.name,
      countryCode: clients.countryCode,
      clientType: clients.clientType,
      status: clients.status,
      createdAt: clients.createdAt,
    })
    .from(clients);
  const countQuery = db.select({ value: count() }).from(clients);

  const [items, [totalRow]] = await Promise.all([
    (searchFilter ? itemQuery.where(searchFilter) : itemQuery)
      .orderBy(asc(clients.name))
      .limit(input.limit)
      .offset(input.offset),
    searchFilter ? countQuery.where(searchFilter) : countQuery,
  ]);

  return {
    items,
    total: totalRow?.value ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function createClient(rawInput: unknown) {
  const input = createClientInputSchema.parse(rawInput);
  const actorUserId = await requireAuthorizedServiceActor(input.sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENTS,
    action: ACTIONS.CREATE,
  });
  const clientId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.transaction((transaction) => {
      transaction
        .insert(clients)
        .values({
          id: clientId,
          clientCode: input.clientCode,
          name: input.name,
          countryCode: input.countryCode,
          clientType: input.clientType,
          status: "active",
          createdAt: now,
          updatedAt: now,
        })
        .run();
      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId,
          eventType: "client.created",
          resource: RESOURCES.CLIENTS,
          action: ACTIONS.CREATE,
          targetType: "client",
          targetId: clientId,
          outcome: "success",
          reason: `Client ${input.clientCode} created`,
          createdAt: now,
        })
        .run();
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ServiceMutationError(
        "conflict",
        "A client with this client ID already exists.",
      );
    }

    throw error;
  }

  return { id: clientId, status: "active" as const };
}

export async function updateClient(rawInput: unknown) {
  const input = updateClientInputSchema.parse(rawInput);
  const actorUserId = await requireAuthorizedServiceActor(input.sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENTS,
    action: ACTIONS.EDIT,
  });
  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, input.clientId))
    .limit(1);

  if (!existing) {
    throw new ServiceMutationError("not_found", "The selected client no longer exists.");
  }

  const now = new Date().toISOString();

  try {
    db.transaction((transaction) => {
      transaction
        .update(clients)
        .set({
          clientCode: input.clientCode,
          name: input.name,
          countryCode: input.countryCode,
          clientType: input.clientType,
          updatedAt: now,
        })
        .where(eq(clients.id, input.clientId))
        .run();
      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId: input.clientId,
          eventType: "client.updated",
          resource: RESOURCES.CLIENTS,
          action: ACTIONS.EDIT,
          targetType: "client",
          targetId: input.clientId,
          outcome: "success",
          reason: `Client ${input.clientCode} updated`,
          createdAt: now,
        })
        .run();
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ServiceMutationError(
        "conflict",
        "A client with this client ID already exists.",
      );
    }

    throw error;
  }

  return { id: input.clientId };
}

export async function setClientStatus(rawInput: unknown) {
  const input = setClientStatusInputSchema.parse(rawInput);
  const permissionAction =
    input.status === "inactive" ? ACTIONS.DELETE : ACTIONS.EDIT;
  const actorUserId = await requireAuthorizedServiceActor(input.sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENTS,
    action: permissionAction,
  });
  const [existing] = await db
    .select({ id: clients.id, status: clients.status, code: clients.clientCode })
    .from(clients)
    .where(eq(clients.id, input.clientId))
    .limit(1);

  if (!existing) {
    throw new ServiceMutationError("not_found", "The selected client no longer exists.");
  }

  const now = new Date().toISOString();
  db.transaction((transaction) => {
    transaction
      .update(clients)
      .set({ status: input.status, updatedAt: now })
      .where(eq(clients.id, input.clientId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: input.clientId,
        eventType: "client.status_changed",
        resource: RESOURCES.CLIENTS,
        action: permissionAction,
        targetType: "client",
        targetId: input.clientId,
        outcome: "success",
        reason: `${existing.status} -> ${input.status}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.clientId, status: input.status };
}
