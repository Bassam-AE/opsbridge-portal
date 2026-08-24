import { AccessDenied } from "@/components/access/access-denied";
import {
  AdminPagination,
  AdminSearch,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/admin-section";
import { getAdminConsoleSessionId, loadAdminData } from "@/lib/admin/console-access";
import { formatAdminDate, parseAdminListQuery } from "@/lib/admin/list-query";
import { listAuditLogs } from "@/services/access-control";

type AuditPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  const sessionId = await getAdminConsoleSessionId();
  if (!sessionId) {
    return <AccessDenied />;
  }

  const query = parseAdminListQuery(await searchParams);
  const result = await loadAdminData(() => listAuditLogs({ sessionId, ...query }));

  if (!result) {
    return <AccessDenied description="You do not have permission to view audit logs." />;
  }

  return (
    <section className="col-span-12 space-y-5">
      <AdminSectionHeader
        title="Audit logs"
        description="Authentication outcomes, denied authorization decisions, and future access-policy changes. Secrets and password data are never recorded."
        total={result.total}
      />
      <AdminSearch
        action="/admin/audit"
        defaultValue={query.search}
        placeholder="Search event, user, client, resource, action, or outcome"
      />
      <AdminTable
        columns={["Date and time", "Event", "Actor", "Client", "Resource", "Outcome", "Reason"]}
        empty={result.items.length === 0}
        emptyMessage={query.search ? "No audit events match this search." : "No audit events have been recorded."}
      >
        {result.items.map((event) => (
          <tr key={event.id} className="border-b border-slate-100 last:border-0">
            <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">{formatAdminDate(event.createdAt, true)}</td>
            <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">{event.eventType}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{event.actorName ?? "System / unknown"}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{event.clientName ?? "Provider"}</td>
            <td className="px-4 py-3.5 text-xs text-slate-500">
              {event.resource ? `${event.resource}${event.action ? `:${event.action}` : ""}` : "—"}
            </td>
            <td className="px-4 py-3.5"><AdminStatusBadge value={event.outcome} /></td>
            <td className="max-w-64 px-4 py-3.5 text-xs leading-5 text-slate-500">{event.reason ?? "—"}</td>
          </tr>
        ))}
      </AdminTable>
      <AdminPagination basePath="/admin/audit" search={query.search} page={query.page} limit={query.limit} total={result.total} />
    </section>
  );
}
