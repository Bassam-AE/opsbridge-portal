import { UserPlus, UsersRound } from "lucide-react";

import { createCompanyUserAction } from "@/app/(portal)/company/actions";
import { AccessDenied } from "@/components/access/access-denied";
import {
  AdminPagination,
  AdminSearch,
  AdminStatusBadge,
  AdminTable,
  adminInputClassName,
  adminLabelClassName,
  adminPrimaryButtonClassName,
} from "@/components/admin/admin-section";
import { requireSession } from "@/lib/auth/require-session";
import { formatAdminDate, parseAdminListQuery } from "@/lib/admin/list-query";
import { requirePortalPageView } from "@/lib/rbac/portal-page-access";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import { listCompanyUsers } from "@/services/company-users";
import { ServiceMutationError } from "@/services/errors";

type CompanyUsersPageProps = {
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

function feedbackMessage(notice?: string, error?: string) {
  if (error === "validation") return "Review the submitted user details and try again.";
  if (error === "conflict") return "A user with that email or username already exists.";
  if (error) return "The company user could not be created.";
  if (notice === "user_created") {
    return "Company employee created with invited status.";
  }
  return null;
}

export default async function CompanyUsersPage({
  searchParams,
}: CompanyUsersPageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const query = parseAdminListQuery(params);
  let result: Awaited<ReturnType<typeof listCompanyUsers>>;

  try {
    await requirePortalPageView(RESOURCES.USERS);
    result = await listCompanyUsers({ sessionId: session.id, ...query });
  } catch (error) {
    if (error instanceof PermissionDeniedError || error instanceof ServiceMutationError) {
      return <AccessDenied />;
    }

    throw error;
  }

  const notice = firstParam(params.notice);
  const error = firstParam(params.error);
  const feedback = feedbackMessage(notice, error);

  return (
    <section className="col-span-12 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-emerald-600 uppercase">
              Client company
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-800">
              Company users
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Create employees only for your own company. New accounts remain invited until password setup is completed.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <UsersRound aria-hidden="true" className="size-4" />
            {result.total} users
          </span>
        </div>

        {feedback ? (
          <div
            role={error ? "alert" : "status"}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              error
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {feedback}
          </div>
        ) : null}

        <details className="group rounded-2xl border border-slate-100 bg-white p-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-slate-700 marker:content-none">
            <UserPlus aria-hidden="true" className="size-5 text-emerald-500" />
            Create company employee
          </summary>
          <form action={createCompanyUserAction} className="mt-5 grid gap-4 md:grid-cols-3">
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
            <div className="md:col-span-3">
              <button type="submit" className={adminPrimaryButtonClassName}>
                Create employee
              </button>
            </div>
          </form>
        </details>

        <AdminSearch
          action="/company/users"
          defaultValue={query.search}
          placeholder="Search company users"
        />
        <AdminTable
          columns={["Employee", "Username", "Email", "Role", "Account", "Membership", "Created"]}
          empty={result.items.length === 0}
          emptyMessage="No company users found."
        >
          {result.items.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3.5 font-medium text-slate-700">{user.displayName}</td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{user.username ?? "—"}</td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{user.email}</td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{user.roleName}</td>
              <td className="px-4 py-3.5"><AdminStatusBadge value={user.status} /></td>
              <td className="px-4 py-3.5"><AdminStatusBadge value={user.membershipStatus} /></td>
              <td className="px-4 py-3.5 text-sm text-slate-500">{formatAdminDate(user.createdAt)}</td>
            </tr>
          ))}
        </AdminTable>
        <AdminPagination
          basePath="/company/users"
          search={query.search}
          page={query.page}
          limit={query.limit}
          total={result.total}
        />
    </section>
  );
}
