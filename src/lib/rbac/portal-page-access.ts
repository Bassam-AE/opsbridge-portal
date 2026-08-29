import { cookies } from "next/headers";

import { requireSession } from "@/lib/auth/require-session";
import {
  clientContextCookieName,
  resolveClientContext,
} from "@/lib/client-context";
import { authorizePortalPageView } from "@/lib/rbac/authorize";
import { resolveResourceClientId } from "@/lib/rbac/portal-access-policy";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import {
  RESOURCE_DEFINITIONS,
  type Resource,
} from "@/lib/rbac/resources";
import { listAvailableClientContexts } from "@/services/client-context";

export async function requirePortalPageView(resource: Resource) {
  const session = await requireSession();
  let currentClientId: string | null = null;

  if (RESOURCE_DEFINITIONS[resource].scope !== "provider") {
    const cookieStore = await cookies();
    let contexts: Awaited<ReturnType<typeof listAvailableClientContexts>> = [];

    try {
      contexts = await listAvailableClientContexts({ sessionId: session.id });
    } catch (error) {
      if (!(error instanceof PermissionDeniedError)) {
        throw error;
      }
    }

    currentClientId = resolveClientContext(
      session.user.accountType,
      cookieStore.get(clientContextCookieName)?.value,
      contexts,
    );
  }

  const decision = await authorizePortalPageView({
    sessionId: session.id,
    clientId: resolveResourceClientId(resource, currentClientId),
    resource,
  });

  if (!decision.allowed) {
    throw new PermissionDeniedError(
      decision.reason === "invalid_session" ? 401 : 403,
      decision,
    );
  }

  return decision;
}
