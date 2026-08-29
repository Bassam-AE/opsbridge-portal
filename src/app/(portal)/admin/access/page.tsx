import { ChevronDown, ShieldAlert } from "lucide-react";

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
import { roleAudienceCanReceiveResource } from "@/lib/rbac/access-policy";
import { isResource, RESOURCE_DEFINITIONS } from "@/lib/rbac/resources";
import { getCurrentProviderRoleId } from "@/services/access-management";
import {
  listPermissionDefinitions,
  listRolesWithPermissions,
  listUserPermissionOverrides,
} from "@/services/access-control";
import { listClients } from "@/services/clients";
import { listUsers } from "@/services/users";

import {
  createUserPermissionOverrideAction,
  replaceRolePermissionsAction,
  revokeUserPermissionOverrideAction,
  updateUserPermissionOverrideAction,
} from "../actions";

type AccessPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    notice?: string | string[];
    error?: string | string[];
  }>;
};

type PermissionItem = {
  id: string;
  resource: string;
  action: string;
  description: string | null;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function groupPermissions<Permission extends { resource: string }>(
  permissionItems: Permission[],
) {
  const grouped = new Map<string, Permission[]>();

  for (const permission of permissionItems) {
    grouped.set(permission.resource, [
      ...(grouped.get(permission.resource) ?? []),
      permission,
    ]);
  }

  return [...grouped.entries()];
}

function toDateTimeLocal(value: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function permissionScope(resource: string): string {
  return isResource(resource) ? RESOURCE_DEFINITIONS[resource].scope : "unknown";
}

export default async function AdminAccessPage({ searchParams }: AccessPageProps) {
  const session = await getAdminConsoleSession();
  if (!session) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const query = parseAdminListQuery(params);
  const data = await loadAdminData(async () => {
    const [roleResult, permissionResult, overrideResult, userResult, clientResult, actorRoleId] =
      await Promise.all([
        listRolesWithPermissions({
          sessionId: session.id,
          search: query.search,
          limit: 100,
          offset: 0,
        }),
        listPermissionDefinitions({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
        listUserPermissionOverrides({ sessionId: session.id, ...query }),
        listUsers({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
        listClients({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
        getCurrentProviderRoleId(session.id),
      ]);

    return { roleResult, permissionResult, overrideResult, userResult, clientResult, actorRoleId };
  });

  if (!data) {
    return <AccessDenied description="You do not have permission to manage roles and permissions." />;
  }

  const {
    roleResult,
    permissionResult,
    overrideResult,
    userResult,
    clientResult,
    actorRoleId,
  } = data;
  const availableUsers = userResult.items.filter(
    (user) => user.id !== session.user.id && user.status !== "disabled",
  );
  const activeClients = clientResult.items.filter((client) => client.status === "active");

  return (
    <section className="col-span-12 space-y-6">
      <AdminSectionHeader
        title="Roles and permissions"
        description={`${roleResult.total} roles use ${permissionResult.total} canonical permission definitions. Changes take effect on the next authorization decision.`}
        total={roleResult.total}
      />
      <AdminActionFeedback
        notice={firstParam(params.notice)}
        error={firstParam(params.error)}
      />
      <AdminSearch
        action="/admin/access"
        defaultValue={query.search}
        placeholder="Search roles, users, permissions, or overrides"
      />

      <div className="space-y-3">
        {roleResult.items.length ? (
          roleResult.items.map((role) => {
            const compatiblePermissions = permissionResult.items.filter(
              (permission) =>
                isResource(permission.resource) &&
                roleAudienceCanReceiveResource(role.audience, permission.resource),
            ) as PermissionItem[];
            const selectedPermissionIds = new Set(
              role.permissions.map((permission) => permission.permissionId),
            );
            const isCurrentRole = role.id === actorRoleId;

            return (
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
                      {isCurrentRole ? (
                        <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Current role</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {role.permissions.length} permissions · {role.key}
                    </p>
                  </div>
                  <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-slate-100 px-5 py-5">
                  <p className="mb-4 text-sm text-slate-500">{role.description}</p>
                  {isCurrentRole ? (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      Your current provider role is read-only here to prevent self-escalation or accidental lockout. Another authorized role can update it.
                    </div>
                  ) : null}
                  <form action={replaceRolePermissionsAction} className="mt-4 space-y-4">
                    <input type="hidden" name="roleId" value={role.id} />
                    <fieldset disabled={isCurrentRole} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 disabled:opacity-70">
                      {groupPermissions(compatiblePermissions).map(([resource, permissionItems]) => (
                        <div key={resource} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700 capitalize">{resource.replaceAll("_", " ")}</p>
                            <span className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">{permissionScope(resource)}</span>
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {permissionItems.map((permission) => (
                              <label key={permission.id} className="flex cursor-pointer items-start gap-2 rounded-lg bg-white px-2.5 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
                                <input
                                  className="mt-0.5 size-3.5 accent-emerald-500"
                                  type="checkbox"
                                  name="permissionIds"
                                  value={permission.id}
                                  defaultChecked={selectedPermissionIds.has(permission.id)}
                                />
                                <span>
                                  <span className="font-medium capitalize">{permission.action.replaceAll("_", " ")}</span>
                                  {permission.description ? (
                                    <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{permission.description}</span>
                                  ) : null}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </fieldset>
                    {!isCurrentRole ? (
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-slate-400">Unchecked permissions will be removed when saved.</p>
                        <button type="submit" className={adminPrimaryButtonClassName}>Save role permissions</button>
                      </div>
                    ) : null}
                  </form>
                </div>
              </details>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center text-sm text-slate-400">No roles match this search.</div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <div>
          <h3 className="font-semibold text-slate-800">User grants and restrictions</h3>
          <p className="mt-1 text-xs text-slate-400">Restrictions win over grants and role permissions. Provider scope uses no client company.</p>
        </div>
        <AdminFormPanel
          summary="Create user override"
          description="Add a direct grant or restriction using an existing permission definition."
        >
          <form action={createUserPermissionOverrideAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={adminLabelClassName}>
              User
              <select className={adminInputClassName} name="userId" required defaultValue="">
                <option value="" disabled>Select a user</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName} — {user.accountType}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Permission
              <select className={adminInputClassName} name="permissionId" required defaultValue="">
                <option value="" disabled>Select a canonical permission</option>
                {permissionResult.items.map((permission) => (
                  <option key={permission.id} value={permission.id}>{permission.resource}:{permission.action} — {permissionScope(permission.resource)}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Client scope
              <select className={adminInputClassName} name="clientId" defaultValue="">
                <option value="">Provider scope</option>
                {activeClients.map((client) => (
                  <option key={client.id} value={client.id}>{client.clientCode} — {client.name}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Effect
              <select className={adminInputClassName} name="effect" required defaultValue="grant">
                <option value="grant">Grant</option>
                <option value="restriction">Restriction</option>
              </select>
            </label>
            <label className={adminLabelClassName}>
              Expires in UTC (optional)
              <input className={adminInputClassName} name="expiresAt" type="datetime-local" />
            </label>
            <label className={adminLabelClassName}>
              Reason
              <input className={adminInputClassName} name="reason" required minLength={3} maxLength={300} placeholder="Why is this exception needed?" />
            </label>
            <div className="flex items-end md:col-span-2 xl:col-span-3">
              <button type="submit" className={adminPrimaryButtonClassName}>Create override</button>
            </div>
          </form>
        </AdminFormPanel>
        <AdminTable
          columns={["User", "Scope", "Permission", "Effect", "Reason", "Created", "Expires", "Actions"]}
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
              <td className="px-4 py-3.5">
                {override.userId === session.user.id ? (
                  <span className="text-xs font-medium text-slate-400">Current account</span>
                ) : (
                  <details className="group/action relative">
                    <summary className={`${adminSecondaryButtonClassName} cursor-pointer list-none marker:content-none`}>Manage</summary>
                    <div className="mt-2 w-72 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-lg">
                      <form action={updateUserPermissionOverrideAction} className="space-y-3">
                        <input type="hidden" name="overrideId" value={override.id} />
                        <label className={adminLabelClassName}>
                          Effect
                          <select className={adminInputClassName} name="effect" required defaultValue={override.effect}>
                            <option value="grant">Grant</option>
                            <option value="restriction">Restriction</option>
                          </select>
                        </label>
                        <label className={adminLabelClassName}>
                          Expires in UTC (optional)
                          <input className={adminInputClassName} name="expiresAt" type="datetime-local" defaultValue={toDateTimeLocal(override.expiresAt)} />
                        </label>
                        <label className={adminLabelClassName}>
                          Reason
                          <input className={adminInputClassName} name="reason" required minLength={3} maxLength={300} defaultValue={override.reason ?? ""} />
                        </label>
                        <button type="submit" className={adminPrimaryButtonClassName}>Save override</button>
                      </form>
                      <form action={revokeUserPermissionOverrideAction} className="mt-3 border-t border-slate-200 pt-3">
                        <input type="hidden" name="overrideId" value={override.id} />
                        <button type="submit" className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Revoke override</button>
                      </form>
                    </div>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
        <AdminPagination basePath="/admin/access" search={query.search} page={query.page} limit={query.limit} total={overrideResult.total} />
      </div>
    </section>
  );
}
