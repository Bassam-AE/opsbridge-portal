import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions } from "@/db/schema";
import {
  PermissionDeniedError,
  requirePermissionForSession,
} from "@/lib/rbac/require-permission";
import type { AuthorizationRequest } from "@/lib/rbac/types";

type PermissionRequest = Omit<AuthorizationRequest, "sessionId">;

export async function requireAuthorizedServiceActor(
  sessionId: string,
  request: PermissionRequest,
): Promise<string> {
  await requirePermissionForSession(sessionId, request);

  const [session] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new PermissionDeniedError(401, {
      allowed: false,
      reason: "invalid_session",
      permission: null,
    });
  }

  return session.userId;
}
