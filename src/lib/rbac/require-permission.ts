import type { AuthenticatedSession } from "@/lib/auth/session";
import { getCurrentSession } from "@/lib/auth/require-session";
import { authorize } from "@/lib/rbac/authorize";
import type { AuthorizationDecision, AuthorizationRequest } from "@/lib/rbac/types";

type PermissionRequest = Omit<AuthorizationRequest, "sessionId">;
type DeniedDecision = Extract<AuthorizationDecision, { allowed: false }>;

export class PermissionDeniedError extends Error {
  readonly status: 401 | 403;
  readonly decision: DeniedDecision;

  constructor(status: 401 | 403, decision: DeniedDecision) {
    super(decision.reason);
    this.name = "PermissionDeniedError";
    this.status = status;
    this.decision = decision;
  }
}

export async function requirePermissionForSession(
  sessionId: string,
  request: PermissionRequest,
): Promise<Extract<AuthorizationDecision, { allowed: true }>> {
  const decision = await authorize({
    ...request,
    sessionId,
  });

  if (!decision.allowed) {
    throw new PermissionDeniedError(
      decision.reason === "invalid_session" ? 401 : 403,
      decision,
    );
  }

  return decision;
}

export async function requirePermission(
  request: PermissionRequest,
): Promise<{
  session: AuthenticatedSession;
  decision: Extract<AuthorizationDecision, { allowed: true }>;
}> {
  const session = await getCurrentSession();

  if (!session) {
    throw new PermissionDeniedError(401, {
      allowed: false,
      reason: "invalid_session",
      permission: null,
    });
  }

  const decision = await requirePermissionForSession(session.id, request);

  return { session, decision };
}
