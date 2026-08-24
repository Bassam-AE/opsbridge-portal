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
import { getAdminConsoleSession, loadAdminData } from "@/lib/admin/console-access";
import { formatAdminDate, parseAdminListQuery } from "@/lib/admin/list-query";
import { listRoles } from "@/services/access-control";
import { listClients } from "@/services/clients";
import { listUsers } from "@/services/users";

import { createUserAction, setUserStatusAction } from "../actions";

type UsersPageProps = {
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

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const session = await getAdminConsoleSession();
  if (!session) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const data = await loadAdminData(async () => {
    const [userResult, roleResult, clientResult] = await Promise.all([
      listUsers({ sessionId: session.id, ...query }),
      listRoles({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
      listClients({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
    ]);
    return { userResult, roleResult, clientResult };
  });

  if (!data) {
    return <AccessDenied description="You do not have permission to view users." />;
  }

  const { userResult: result, roleResult, clientResult } = data;
  const activeClients = clientResult.items.filter((client) => client.status === "active");

  return (
    <section className="col-span-12 space-y-5">
      <AdminSectionHeader
        title="Users and employees"
        description="Internal employees and client users currently registered in the portal. Password hashes and session data are never exposed here."
        total={result.total}
      />
      <AdminActionFeedback
        notice={firstParam(params.notice)}
        error={firstParam(params.error)}
      />
      <AdminFormPanel
        summary="Create user"
        description="Add an employee or client user and assign their initial role."
      >
        <form action={createUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className={adminLabelClassName}>
            Full name
            <input className={adminInputClassName} name="displayName" required minLength={2} maxLength={100} />
          </label>
          <label className={adminLabelClassName}>
            Email
            <input className={adminInputClassName} name="email" type="email" required maxLength={254} />
          </label>
          <label className={adminLabelClassName}>
            Username (optional)
            <input className={adminInputClassName} name="username" minLength={3} maxLength={64} pattern="[A-Za-z0-9._-]+" />
          </label>
          <label className={adminLabelClassName}>
            Account type
            <select className={adminInputClassName} name="accountType" required defaultValue="internal">
              <option value="internal">Internal employee</option>
              <option value="client">Client employee</option>
            </select>
          </label>
          <label className={adminLabelClassName}>
            Initial role
            <select className={adminInputClassName} name="roleId" required defaultValue="">
              <option value="" disabled>Select a compatible role</option>
              {roleResult.items.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.audience === "internal" ? "Internal" : "Client"} — {role.name}
                </option>
              ))}
            </select>
          </label>
          <label className={adminLabelClassName}>
            Client company (client users only)
            <select className={adminInputClassName} name="clientId" defaultValue="">
              <option value="">No client company</option>
              {activeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientCode} — {client.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col items-start justify-end gap-2 md:col-span-2 xl:col-span-3">
            <p className="text-xs leading-5 text-slate-400">
              New users are created as invited and cannot sign in until password setup is added.
            </p>
            <button type="submit" className={adminPrimaryButtonClassName}>Create user</button>
          </div>
        </form>
      </AdminFormPanel>
      <AdminSearch
        action="/admin/users"
        defaultValue={query.search}
        placeholder="Search by name, username, or email"
      />
      <AdminTable
        columns={["User", "Username", "Email", "Account type", "Status", "Created", "Actions"]}
        empty={result.items.length === 0}
        emptyMessage={query.search ? "No users match this search." : "No users have been created yet."}
      >
        {result.items.map((user) => (
          <tr key={user.id} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                  {user.displayName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="font-medium text-slate-700">{user.displayName}</span>
              </div>
            </td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{user.username ?? "—"}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{user.email}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500 capitalize">{user.accountType}</td>
            <td className="px-4 py-3.5"><AdminStatusBadge value={user.status} /></td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{formatAdminDate(user.createdAt)}</td>
            <td className="px-4 py-3.5">
              {user.id === session.user.id ? (
                <span className="text-xs font-medium text-slate-400">Current account</span>
              ) : (
                <form action={setUserStatusAction}>
                  <input type="hidden" name="targetUserId" value={user.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={user.status === "disabled" ? "active" : "disabled"}
                  />
                  <button type="submit" className={adminSecondaryButtonClassName}>
                    {user.status === "disabled" ? "Enable" : "Disable"}
                  </button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
      <AdminPagination basePath="/admin/users" search={query.search} page={query.page} limit={query.limit} total={result.total} />
    </section>
  );
}
