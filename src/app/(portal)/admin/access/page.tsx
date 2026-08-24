import { ChevronDown } from "lucide-react";

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
import {
  listPermissionDefinitions,
  listRolesWithPermissions,
  listUserPermissionOverrides,
} from "@/services/access-control";

type AccessPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

function groupPermissions(
  permissions: Array<{ resource: string; action: string }>,
) {
  const grouped = new Map<string, string[]>();

  for (const permission of permissions) {
    const actions = grouped.get(permission.resource) ?? [];
    actions.push(permission.action);
    grouped.set(permission.resource, actions);
  }

  return [...grouped.entries()];
}

export default async function AdminAccessPage({ searchParams }: AccessPageProps) {
  const sessionId = await getAdminConsoleSessionId();
  if (!sessionId) {
    return <AccessDenied />;
  }

  const query = parseAdminListQuery(await searchParams);
  const data = await loadAdminData(() =>
    Promise.all([
      listRolesWithPermissions({
        sessionId,
        search: query.search,
        limit: 100,
        offset: 0,
      }),
      listPermissionDefinitions({ sessionId, search: "", limit: 1, offset: 0 }),
      listUserPermissionOverrides({ sessionId, ...query }),
    ]),
  );

  if (!data) {
    return <AccessDenied description="You do not have permission to view roles and permissions." />;
  }

  const [roleResult, permissionResult, overrideResult] = data;

  return (
    <section className="col-span-12 space-y-6">
      <AdminSectionHeader
        title="Roles and permissions"
        description={`${roleResult.total} roles use ${permissionResult.total} canonical permission definitions. Expand a role to inspect every assigned permission.`}
        total={roleResult.total}
      />
      <AdminSearch
        action="/admin/access"
        defaultValue={query.search}
        placeholder="Search roles, users, permissions, or overrides"
      />

      <div className="space-y-3">
        {roleResult.items.length ? (
          roleResult.items.map((role) => (
            <details
              key={role.id}
              className="group rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-700">{role.name}</h3>
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      {role.audience}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {role.permissions.length} permissions · {role.key}
                  </p>
                </div>
                <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-slate-100 px-5 py-5">
                <p className="mb-4 text-sm text-slate-500">{role.description}</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {groupPermissions(role.permissions).map(([resource, actions]) => (
                    <div key={resource} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold text-slate-700 capitalize">
                        {resource.replaceAll("_", " ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {actions.map((action) => (
                          <span key={action} className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                            {action.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center text-sm text-slate-400">
            No roles match this search.
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <div>
          <h3 className="font-semibold text-slate-800">User grants and restrictions</h3>
          <p className="mt-1 text-xs text-slate-400">Explicit overrides take effect on the next authorization decision.</p>
        </div>
        <AdminTable
          columns={["User", "Scope", "Permission", "Effect", "Reason", "Created", "Expires"]}
          empty={overrideResult.items.length === 0}
          emptyMessage={query.search ? "No overrides match this search." : "No user grants or restrictions have been created."}
        >
          {overrideResult.items.map((override) => (
            <tr key={override.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3.5">
                <p className="font-medium text-slate-700">{override.userName}</p>
                <p className="mt-0.5 text-xs text-slate-400">{override.userEmail}</p>
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{override.clientName ?? "Provider"}</td>
              <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{override.resource}:{override.action}</td>
              <td className="px-4 py-3.5"><AdminStatusBadge value={override.effect} /></td>
              <td className="max-w-56 px-4 py-3.5 text-sm text-slate-500">{override.reason ?? "—"}</td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{formatAdminDate(override.createdAt)}</td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{override.expiresAt ? formatAdminDate(override.expiresAt) : "Never"}</td>
            </tr>
          ))}
        </AdminTable>
        <AdminPagination basePath="/admin/access" search={query.search} page={query.page} limit={query.limit} total={overrideResult.total} />
      </div>
    </section>
  );
}
