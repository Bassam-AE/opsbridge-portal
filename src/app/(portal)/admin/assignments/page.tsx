import Link from "next/link";

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
import {
  listClientAssignments,
  listClientMemberships,
  listRoles,
} from "@/services/access-control";
import { listClients } from "@/services/clients";
import { listUsers } from "@/services/users";

import {
  createClientMembershipAction,
  createEmployeeAssignmentAction,
  setClientMembershipStatusAction,
  setEmployeeAssignmentStatusAction,
  updateClientMembershipAction,
  updateEmployeeAssignmentAction,
} from "../actions";

type AssignmentsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    type?: string | string[];
    notice?: string | string[];
    error?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const session = await getAdminConsoleSession();
  if (!session) return <AccessDenied />;

  const rawParams = await searchParams;
  const query = parseAdminListQuery(rawParams);
  const assignmentType = firstParam(rawParams.type) === "client" ? "client" : "employee";
  const data = await loadAdminData(async () => {
    const [selectedResult, userResult, clientResult, roleResult, allMemberships] =
      await Promise.all([
        assignmentType === "client"
          ? listClientMemberships({ sessionId: session.id, ...query })
          : listClientAssignments({ sessionId: session.id, ...query }),
        listUsers({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
        listClients({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
        listRoles({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
        listClientMemberships({ sessionId: session.id, search: "", limit: 100, offset: 0 }),
      ]);
    const items = selectedResult.items.map((item) => ({
      ...item,
      effectiveAt: "joinedAt" in item ? item.joinedAt : item.assignedAt,
    }));

    return {
      result: { ...selectedResult, items },
      userResult,
      clientResult,
      roleResult,
      allMemberships,
    };
  });

  if (!data) {
    return <AccessDenied description="You do not have permission to manage client assignments." />;
  }

  const { result, userResult, clientResult, roleResult, allMemberships } = data;
  const activeClients = clientResult.items.filter(({ status }) => status === "active");
  const internalUsers = userResult.items.filter(
    (user) =>
      user.accountType === "internal" &&
      user.status !== "disabled" &&
      user.id !== session.user.id,
  );
  const assignedClientUserIds = new Set(allMemberships.items.map(({ userId }) => userId));
  const availableClientUsers = userResult.items.filter(
    (user) =>
      user.accountType === "client" &&
      user.status !== "disabled" &&
      !assignedClientUserIds.has(user.id),
  );
  const internalRoles = roleResult.items.filter(({ audience }) => audience === "internal");
  const clientRoles = roleResult.items.filter(({ audience }) => audience === "client");
  const canCreateEmployeeAssignment =
    internalUsers.length > 0 && activeClients.length > 0 && internalRoles.length > 0;
  const canCreateClientMembership =
    availableClientUsers.length > 0 && activeClients.length > 0 && clientRoles.length > 0;

  return (
    <section className="col-span-12 space-y-5">
      <AdminSectionHeader
        title="Client assignments"
        description="Manage the exact client scope and role for internal employees and client users. Changes affect the next authorization decision."
        total={result.total}
      />
      <AdminActionFeedback
        notice={firstParam(rawParams.notice)}
        error={firstParam(rawParams.error)}
      />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <Link
          href="/admin/assignments?type=employee"
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            assignmentType === "employee"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Internal employees
        </Link>
        <Link
          href="/admin/assignments?type=client"
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            assignmentType === "client"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Client users
        </Link>
      </div>

      {assignmentType === "employee" ? (
        <AdminFormPanel
          summary="Assign employee to client"
          description="Give an internal employee a role that applies only inside one client company."
        >
          <form action={createEmployeeAssignmentAction} className="grid gap-4 md:grid-cols-3">
            <label className={adminLabelClassName}>
              Employee
              <select className={adminInputClassName} name="userId" required defaultValue="">
                <option value="" disabled>Select employee</option>
                {internalUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName} — {user.email}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Client company
              <select className={adminInputClassName} name="clientId" required defaultValue="">
                <option value="" disabled>Select client</option>
                {activeClients.map((client) => (
                  <option key={client.id} value={client.id}>{client.clientCode} — {client.name}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Client-scoped role
              <select className={adminInputClassName} name="roleId" required defaultValue="">
                <option value="" disabled>Select role</option>
                {internalRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </label>
            {!canCreateEmployeeAssignment ? (
              <p className="text-xs text-amber-600 md:col-span-3">
                Create another internal user and an active client before adding an assignment. Your own access cannot be changed here.
              </p>
            ) : null}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={!canCreateEmployeeAssignment}
                className={`${adminPrimaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Create assignment
              </button>
            </div>
          </form>
        </AdminFormPanel>
      ) : (
        <AdminFormPanel
          summary="Create client-user membership"
          description="Connect a client account without a membership to its company and client role."
        >
          <form action={createClientMembershipAction} className="grid gap-4 md:grid-cols-3">
            <label className={adminLabelClassName}>
              Client user
              <select className={adminInputClassName} name="userId" required defaultValue="">
                <option value="" disabled>Select client user</option>
                {availableClientUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName} — {user.email}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Client company
              <select className={adminInputClassName} name="clientId" required defaultValue="">
                <option value="" disabled>Select client</option>
                {activeClients.map((client) => (
                  <option key={client.id} value={client.id}>{client.clientCode} — {client.name}</option>
                ))}
              </select>
            </label>
            <label className={adminLabelClassName}>
              Client role
              <select className={adminInputClassName} name="roleId" required defaultValue="">
                <option value="" disabled>Select role</option>
                {clientRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </label>
            {!canCreateClientMembership ? (
              <p className="text-xs text-amber-600 md:col-span-3">
                Client users created here already receive a membership. This form supports imported or repaired accounts without one.
              </p>
            ) : null}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={!canCreateClientMembership}
                className={`${adminPrimaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Create membership
              </button>
            </div>
          </form>
        </AdminFormPanel>
      )}

      <AdminSearch
        action="/admin/assignments"
        defaultValue={query.search}
        hiddenFields={{ type: assignmentType }}
        placeholder="Search employee, client, or role"
      />

      <AdminTable
        columns={[
          "Person",
          "Client company",
          "Role",
          "Status",
          assignmentType === "client" ? "Joined" : "Assigned",
          "Actions",
        ]}
        empty={result.items.length === 0}
        emptyMessage={
          query.search
            ? "No assignments match this search."
            : assignmentType === "client"
              ? "No client users have been assigned yet."
              : "No internal employees have been assigned yet."
        }
      >
        {result.items.map((assignment) => {
          const isOwnAssignment =
            assignmentType === "employee" && assignment.userId === session.user.id;

          return (
            <tr key={assignment.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3.5 font-medium text-slate-700">{assignment.userName}</td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{assignment.clientName}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-emerald-700">{assignment.roleName}</td>
              <td className="px-4 py-3.5"><AdminStatusBadge value={assignment.status} /></td>
              <td className="px-4 py-3.5 text-sm text-slate-500">
                {formatAdminDate(assignment.effectiveAt)}
              </td>
              <td className="px-4 py-3.5 align-top">
                {isOwnAssignment ? (
                  <span className="text-xs font-medium text-slate-400">Self-protected</span>
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <form
                      action={
                        assignmentType === "client"
                          ? setClientMembershipStatusAction
                          : setEmployeeAssignmentStatusAction
                      }
                    >
                      <input
                        type="hidden"
                        name={assignmentType === "client" ? "membershipId" : "assignmentId"}
                        value={assignment.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={assignment.status === "active" ? "inactive" : "active"}
                      />
                      <button type="submit" className={adminSecondaryButtonClassName}>
                        {assignment.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <details>
                      <summary className="cursor-pointer list-none text-xs font-semibold text-emerald-600 marker:content-none">
                        Edit access
                      </summary>
                      <form
                        action={
                          assignmentType === "client"
                            ? updateClientMembershipAction
                            : updateEmployeeAssignmentAction
                        }
                        className="mt-3 grid min-w-64 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <input
                          type="hidden"
                          name={assignmentType === "client" ? "membershipId" : "assignmentId"}
                          value={assignment.id}
                        />
                        {assignmentType === "client" ? (
                          <label className={adminLabelClassName}>
                            Client company
                            <select className={adminInputClassName} name="clientId" required defaultValue={assignment.clientId}>
                              {activeClients.map((client) => (
                                <option key={client.id} value={client.id}>{client.clientCode} — {client.name}</option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                        <label className={adminLabelClassName}>
                          Role
                          <select className={adminInputClassName} name="roleId" required defaultValue={assignment.roleId}>
                            {(assignmentType === "client" ? clientRoles : internalRoles).map((role) => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </label>
                        <button type="submit" className={adminPrimaryButtonClassName}>Save access</button>
                      </form>
                    </details>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </AdminTable>

      <AdminPagination
        basePath="/admin/assignments"
        search={query.search}
        page={query.page}
        limit={query.limit}
        total={result.total}
        additionalParams={{ type: assignmentType }}
      />
    </section>
  );
}
