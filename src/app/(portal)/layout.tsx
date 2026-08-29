import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { portalNavigation } from "@/components/layout/portal-navigation";
import {
  clientContextCookieName,
  resolveClientContext,
} from "@/lib/client-context";
import { requireSession } from "@/lib/auth/require-session";
import { authorize, authorizePortalPageView } from "@/lib/rbac/authorize";
import { ACTIONS } from "@/lib/rbac/actions";
import { RESOURCE_DEFINITIONS, RESOURCES } from "@/lib/rbac/resources";
import { resolveResourceClientId } from "@/lib/rbac/portal-access-policy";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import { listAvailableClientContexts } from "@/services/client-context";

export default async function PortalLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireSession();
  const cookieStore = await cookies();
  let clientContexts: Awaited<ReturnType<typeof listAvailableClientContexts>> = [];

  try {
    clientContexts = await listAvailableClientContexts({ sessionId: session.id });
  } catch (error) {
    if (!(error instanceof PermissionDeniedError)) {
      throw error;
    }
  }

  const currentClientId = resolveClientContext(
    session.user.accountType,
    cookieStore.get(clientContextCookieName)?.value,
    clientContexts,
  );
  const navigationAccess = await Promise.all(
    portalNavigation.map(async ({ href, resource }) => {
      if (
        session.user.accountType === "internal" &&
        !currentClientId &&
        RESOURCE_DEFINITIONS[resource].scope === "client"
      ) {
        return null;
      }

      const clientId = resolveResourceClientId(resource, currentClientId);
      const decision = await authorizePortalPageView(
        {
          sessionId: session.id,
          clientId,
          resource,
        },
        { auditDenied: false },
      );

      return decision.allowed ? href : null;
    }),
  );
  const canManageCompanyUsers =
    session.user.accountType === "client" && currentClientId
      ? (
          await authorize(
            {
              sessionId: session.id,
              clientId: currentClientId,
              resource: RESOURCES.USERS,
              action: ACTIONS.VIEW,
            },
            { auditDenied: false },
          )
        ).allowed
      : false;

  return (
    <DashboardShell
      allowedNavigationHrefs={navigationAccess.filter(
        (href): href is NonNullable<typeof href> => href !== null,
      )}
      canManageCompanyUsers={canManageCompanyUsers}
      clientContexts={clientContexts}
      currentClientId={currentClientId}
      currentUser={session.user}
    >
      {children}
    </DashboardShell>
  );
}
