import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  PermissionDeniedError,
  requirePermissionForSession,
} from "@/lib/rbac/require-permission";
import type { AuthorizationRequest } from "@/lib/rbac/types";

type PermissionRequest = Omit<AuthorizationRequest, "sessionId">;

export async function requireValidServiceIdentity(sessionId: string): Promise<{
  userId: string;
  accountType: "internal" | "client";
}> {
  const [identity] = await db
    .select({
      userId: users.id,
      accountType: users.accountType,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date().toISOString()),
        isNull(sessions.invalidatedAt),
      ),
    )
    .limit(1);

  if (!identity) {
    throw new PermissionDeniedError(401, {
      allowed: false,
      reason: "invalid_session",
      permission: null,
    });
  }

  if (identity.status !== "active") {
    throw new PermissionDeniedError(403, {
      allowed: false,
      reason: "disabled_user",
      permission: null,
    });
  }

  return { userId: identity.userId, accountType: identity.accountType };
}

export async function requireAuthorizedServiceActor(
  sessionId: string,
  request: PermissionRequest,
): Promise<string> {
  await requirePermissionForSession(sessionId, request);
  return (await requireValidServiceIdentity(sessionId)).userId;
}
