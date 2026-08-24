import { ACTIONS } from "@/lib/rbac/actions";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import type { AuthenticatedSession } from "@/lib/auth/session";

export async function getAdminConsoleSession(): Promise<AuthenticatedSession | null> {
  try {
    const access = await requirePermission({
      clientId: null,
      resource: RESOURCES.ADMIN_CONSOLE,
      action: ACTIONS.VIEW,
    });

    return access.session;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return null;
    }

    throw error;
  }
}

export async function getAdminConsoleSessionId(): Promise<string | null> {
  const session = await getAdminConsoleSession();
  return session?.id ?? null;
}

export async function loadAdminData<Result>(
  loader: () => Promise<Result>,
): Promise<Result | null> {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return null;
    }

    throw error;
  }
}
