import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireSession } from "@/lib/auth/require-session";
import { ACTIONS } from "@/lib/rbac/actions";
import { authorize } from "@/lib/rbac/authorize";
import { RESOURCES } from "@/lib/rbac/resources";

export default async function PortalLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireSession();
  const adminConsoleAccess = await authorize(
    {
      sessionId: session.id,
      clientId: null,
      resource: RESOURCES.ADMIN_CONSOLE,
      action: ACTIONS.VIEW,
    },
    { auditDenied: false },
  );

  return (
    <DashboardShell
      canAccessAdminConsole={adminConsoleAccess.allowed}
      currentUser={session.user}
    >
      {children}
    </DashboardShell>
  );
}
