import Link from "next/link";

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
  listClientAssignments,
  listClientMemberships,
} from "@/services/access-control";

type AssignmentsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    type?: string | string[];
  }>;
};

export default async function AdminAssignmentsPage({
  searchParams,
}: AssignmentsPageProps) {
  const sessionId = await getAdminConsoleSessionId();
  if (!sessionId) {
    return <AccessDenied />;
  }

  const rawParams = await searchParams;
  const query = parseAdminListQuery(rawParams);
  const rawType = Array.isArray(rawParams.type) ? rawParams.type[0] : rawParams.type;
  const assignmentType = rawType === "client" ? "client" : "employee";
  const result = await loadAdminData(async () => {
    if (assignmentType === "client") {
      const membershipResult = await listClientMemberships({ sessionId, ...query });
      return {
        ...membershipResult,
        items: membershipResult.items.map(({ joinedAt, ...membership }) => ({
          ...membership,
          effectiveAt: joinedAt,
        })),
      };
    }

    const assignmentResult = await listClientAssignments({ sessionId, ...query });
    return {
      ...assignmentResult,
      items: assignmentResult.items.map(({ assignedAt, ...assignment }) => ({
        ...assignment,
        effectiveAt: assignedAt,
      })),
    };
  });

  if (!result) {
    return <AccessDenied description="You do not have permission to view client assignments." />;
  }

  return (
    <section className="col-span-12 space-y-5">
      <AdminSectionHeader
        title="Client assignments"
        description="Internal employee assignments and client-user memberships, including the role that applies inside each company."
        total={result.total}
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

      <AdminSearch
        action="/admin/assignments"
        defaultValue={query.search}
        hiddenFields={{ type: assignmentType }}
        placeholder="Search employee, client, or role"
      />

      <AdminTable
        columns={["Person", "Client company", "Role", "Status", assignmentType === "client" ? "Joined" : "Assigned"]}
        empty={result.items.length === 0}
        emptyMessage={
          query.search
            ? "No assignments match this search."
            : assignmentType === "client"
              ? "No client users have been assigned yet."
              : "No internal employees have been assigned yet."
        }
      >
        {result.items.map((assignment) => (
          <tr key={assignment.id} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3.5 font-medium text-slate-700">{assignment.userName}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{assignment.clientName}</td>
            <td className="px-4 py-3.5 text-sm font-medium text-emerald-700">{assignment.roleName}</td>
            <td className="px-4 py-3.5"><AdminStatusBadge value={assignment.status} /></td>
            <td className="px-4 py-3.5 text-sm text-slate-500">
              {formatAdminDate(assignment.effectiveAt)}
            </td>
          </tr>
        ))}
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
