import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  ContactRound,
  Handshake,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { RESOURCES } from "@/lib/rbac/resources";

export const portalNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, resource: RESOURCES.DASHBOARD },
  { label: "Clients", href: "/clients", icon: Building2, resource: RESOURCES.CLIENTS },
  { label: "CRM", href: "/crm", icon: ContactRound, resource: RESOURCES.CRM },
  { label: "HRM", href: "/hrm", icon: UsersRound, resource: RESOURCES.HRM },
  { label: "VMS", href: "/vms", icon: Handshake, resource: RESOURCES.VMS },
  { label: "BMS", href: "/bms", icon: BriefcaseBusiness, resource: RESOURCES.BMS },
  { label: "Vault", href: "/vault", icon: LockKeyhole, resource: RESOURCES.VAULT },
  { label: "Internal Chat", href: "/chat", icon: MessagesSquare, resource: RESOURCES.INTERNAL_CHAT },
  { label: "Marketing", href: "/marketing", icon: Megaphone, resource: RESOURCES.MARKETING },
  { label: "Accounts", href: "/accounts", icon: BadgeDollarSign, resource: RESOURCES.ACCOUNTS },
  { label: "Admin Console", href: "/admin", icon: ShieldCheck, resource: RESOURCES.ADMIN_CONSOLE },
] as const;

export function getPortalPageTitle(pathname: string) {
  if (pathname === "/company/users") return "Company users";

  return (
    portalNavigation.find(
      ({ href }) =>
        pathname === href ||
        (href === "/admin" && pathname.startsWith("/admin/")) ||
        (href === "/clients" && pathname.startsWith("/clients/")),
    )?.label ?? "Dashboard"
  );
}
