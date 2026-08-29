import type { ReactNode } from "react";

import { AccessDenied } from "@/components/access/access-denied";
import { requirePortalPageView } from "@/lib/rbac/portal-page-access";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import type { Resource } from "@/lib/rbac/resources";

export async function ProtectedPortalPage({
  children,
  resource,
}: {
  children: ReactNode;
  resource: Resource;
}) {
  try {
    await requirePortalPageView(resource);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return <AccessDenied />;
    }

    throw error;
  }

  return children;
}
