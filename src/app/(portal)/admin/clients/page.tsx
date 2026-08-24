import { AccessDenied } from "@/components/access/access-denied";
import {
  AdminActionFeedback,
  AdminFormPanel,
  AdminPagination,
  AdminSearch,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminTable,
  adminInputClassName,
  adminLabelClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "@/components/admin/admin-section";
import { getAdminConsoleSessionId, loadAdminData } from "@/lib/admin/console-access";
import { formatAdminDate, parseAdminListQuery } from "@/lib/admin/list-query";
import { listClients } from "@/services/clients";

import {
  createClientAction,
  setClientStatusAction,
  updateClientAction,
} from "../actions";

type ClientsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    notice?: string | string[];
    error?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminClientsPage({ searchParams }: ClientsPageProps) {
  const sessionId = await getAdminConsoleSessionId();
  if (!sessionId) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const result = await loadAdminData(() => listClients({ sessionId, ...query }));

  if (!result) {
    return <AccessDenied description="You do not have permission to view client companies." />;
  }

  return (
    <section className="col-span-12 space-y-5">
      <AdminSectionHeader
        title="Client companies"
        description="All client-company records available in the provider context."
        total={result.total}
      />
      <AdminActionFeedback
        notice={firstParam(params.notice)}
        error={firstParam(params.error)}
      />
      <AdminFormPanel
        summary="Create client company"
        description="Add a company record before assigning employees or client users."
      >
        <form action={createClientAction} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className={adminLabelClassName}>
            Client ID
            <input className={adminInputClassName} name="clientCode" required minLength={2} maxLength={30} placeholder="ACME-IN" />
          </label>
          <label className={adminLabelClassName}>
            Company name
            <input className={adminInputClassName} name="name" required minLength={2} maxLength={120} />
          </label>
          <label className={adminLabelClassName}>
            Country code
            <input className={adminInputClassName} name="countryCode" required minLength={2} maxLength={2} placeholder="IN" />
          </label>
          <label className={adminLabelClassName}>
            Client type
            <input className={adminInputClassName} name="clientType" required minLength={2} maxLength={80} placeholder="Private Limited" />
          </label>
          <div className="sm:col-span-2 xl:col-span-4">
            <button type="submit" className={adminPrimaryButtonClassName}>Create client</button>
          </div>
        </form>
      </AdminFormPanel>
      <AdminSearch
        action="/admin/clients"
        defaultValue={query.search}
        placeholder="Search by client code, company, country, or type"
      />
      <AdminTable
        columns={["Client ID", "Company", "Country", "Type", "Status", "Client since", "Actions"]}
        empty={result.items.length === 0}
        emptyMessage={query.search ? "No clients match this search." : "No client companies have been created yet."}
      >
        {result.items.map((client) => (
          <tr key={client.id} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-700">{client.clientCode}</td>
            <td className="px-4 py-3.5 font-medium text-slate-700">{client.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500 uppercase">{client.countryCode}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{client.clientType}</td>
            <td className="px-4 py-3.5"><AdminStatusBadge value={client.status} /></td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{formatAdminDate(client.createdAt)}</td>
            <td className="px-4 py-3.5 align-top">
              <div className="flex flex-col items-start gap-2">
                <form action={setClientStatusAction}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={client.status === "active" ? "inactive" : "active"}
                  />
                  <button type="submit" className={adminSecondaryButtonClassName}>
                    {client.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </form>
                <details>
                  <summary className="cursor-pointer list-none text-xs font-semibold text-emerald-600 marker:content-none">
                    Edit details
                  </summary>
                  <form action={updateClientAction} className="mt-3 grid min-w-64 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <input type="hidden" name="clientId" value={client.id} />
                    <label className={adminLabelClassName}>
                      Client ID
                      <input className={adminInputClassName} name="clientCode" required defaultValue={client.clientCode} />
                    </label>
                    <label className={adminLabelClassName}>
                      Company
                      <input className={adminInputClassName} name="name" required defaultValue={client.name} />
                    </label>
                    <label className={adminLabelClassName}>
                      Country
                      <input className={adminInputClassName} name="countryCode" required minLength={2} maxLength={2} defaultValue={client.countryCode} />
                    </label>
                    <label className={adminLabelClassName}>
                      Type
                      <input className={adminInputClassName} name="clientType" required defaultValue={client.clientType} />
                    </label>
                    <button type="submit" className={adminPrimaryButtonClassName}>Save changes</button>
                  </form>
                </details>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
      <AdminPagination basePath="/admin/clients" search={query.search} page={query.page} limit={query.limit} total={result.total} />
    </section>
  );
}
