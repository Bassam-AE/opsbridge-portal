import { ArrowLeft, Building2, LogIn, Settings2 } from "lucide-react";
import Link from "next/link";
import { ZodError } from "zod";

import { enterClientPortalAction } from "@/app/(portal)/context-actions";
import { AccessDenied } from "@/components/access/access-denied";
import { requireSession } from "@/lib/auth/require-session";
import { requirePortalPageView } from "@/lib/rbac/portal-page-access";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import { getClientDetails } from "@/services/clients";
import { ServiceMutationError } from "@/services/errors";

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  let client: Awaited<ReturnType<typeof getClientDetails>>;

  try {
    await requirePortalPageView(RESOURCES.CLIENTS);
    const session = await requireSession();
    const { clientId } = await params;
    client = await getClientDetails({ sessionId: session.id, clientId });
  } catch (error) {
    if (
      error instanceof PermissionDeniedError ||
      error instanceof ServiceMutationError ||
      error instanceof ZodError
    ) {
      return (
        <AccessDenied
          title="Client unavailable"
          description="This client is not assigned to you or is no longer available."
        />
      );
    }

    throw error;
  }

  return (
    <section className="col-span-12 space-y-5">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Clients
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
          <div className="flex flex-col gap-5 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Building2 aria-hidden="true" className="size-6" strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-mono text-xs font-semibold text-slate-400">
                  {client.clientCode}
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-800">
                  {client.name}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {client.canViewAllClients ? (
                <Link
                  href="/admin/assignments?type=employee"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                >
                  <Settings2 aria-hidden="true" className="size-4" />
                  Manage assignments
                </Link>
              ) : null}
              {client.canEnterClientPortal ? (
                <form action={enterClientPortalAction}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <button
                    type="submit"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <LogIn aria-hidden="true" className="size-4" />
                    Enter client portal
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <dl className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Country", client.countryCode],
              ["Client type", client.clientType],
              ["Status", client.status],
              ["Client since", client.createdAt.slice(0, 10)],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-5">
                <dt className="text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                  {label}
                </dt>
                <dd className="mt-2 text-sm font-semibold text-slate-700 capitalize">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {!client.canEnterClientPortal ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            You can view this client, but an active employee assignment is required to enter its portal.
          </p>
        ) : null}
    </section>
  );
}
