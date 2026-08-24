import {
  ArrowUpRight,
  Building2,
  KeyRound,
  Network,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const administrationAreas = [
  {
    title: "Users and employees",
    description: "Review internal and client user identities and account status.",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "Client companies",
    description: "Review client records and current company status.",
    href: "/admin/clients",
    icon: Building2,
  },
  {
    title: "Client assignments",
    description: "Inspect internal assignments and client memberships.",
    href: "/admin/assignments",
    icon: Network,
  },
  {
    title: "Roles and permissions",
    description: "Inspect role permissions, user grants, and restrictions.",
    href: "/admin/access",
    icon: KeyRound,
  },
  {
    title: "Audit logs",
    description: "Review access changes and important denied requests.",
    href: "/admin/audit",
    icon: ScrollText,
  },
] as const;

export type AdminConsoleStatistics = {
  users: number;
  clients: number;
  employeeAssignments: number;
  clientMemberships: number;
  roles: number;
  permissions: number;
  permissionOverrides: number;
  auditLogs: number;
};

type AdminConsolePlaceholderProps = {
  statistics: AdminConsoleStatistics;
};

export function AdminConsolePlaceholder({
  statistics,
}: AdminConsolePlaceholderProps) {
  const areaStatistics = [
    `${statistics.users} user${statistics.users === 1 ? "" : "s"}`,
    `${statistics.clients} client${statistics.clients === 1 ? "" : "s"}`,
    `${statistics.employeeAssignments} employee · ${statistics.clientMemberships} client`,
    `${statistics.roles} roles · ${statistics.permissions} permissions · ${statistics.permissionOverrides} overrides`,
    `${statistics.auditLogs} recorded events`,
  ];

  return (
    <section className="col-span-12 min-w-0">
      <div className="rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck aria-hidden="true" className="size-6" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-800">Administration</h2>
              <p className="mt-1 text-xs text-slate-400">
                Secure access and organization management
              </p>
            </div>
          </div>

          <span className="w-fit rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            Admin and executive access only
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-3">
          {administrationAreas.map(({ title, description, href, icon: Icon }, index) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] hover:ring-emerald-100"
            >
              <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-slate-300 transition group-hover:text-emerald-600"
                />
              </div>
              <h3 className="mt-5 text-sm font-semibold text-slate-700">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
              <p className="mt-4 text-[11px] font-semibold tracking-[0.08em] text-emerald-600 uppercase">
                {areaStatistics[index]}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
