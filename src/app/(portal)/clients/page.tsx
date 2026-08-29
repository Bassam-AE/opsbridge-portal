import { AccessDenied } from "@/components/access/access-denied";
import { ClientsTable } from "@/components/clients/clients-table";
import { requireSession } from "@/lib/auth/require-session";
import { requirePortalPageView } from "@/lib/rbac/portal-page-access";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import { listClients } from "@/services/clients";

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof listClients>>["items"];

  try {
    await requirePortalPageView(RESOURCES.CLIENTS);
    const session = await requireSession();
    const result = await listClients({
      sessionId: session.id,
      search: "",
      limit: 100,
      offset: 0,
    });
    clients = result.items;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return <AccessDenied />;
    }

    throw error;
  }

  return <ClientsTable clients={clients} />;
}
