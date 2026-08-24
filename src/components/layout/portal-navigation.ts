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

export const portalNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Building2 },
  { label: "CRM", href: "/crm", icon: ContactRound },
  { label: "HRM", href: "/hrm", icon: UsersRound },
  { label: "VMS", href: "/vms", icon: Handshake },
  { label: "BMS", href: "/bms", icon: BriefcaseBusiness },
  { label: "Vault", href: "/vault", icon: LockKeyhole },
  { label: "Internal Chat", href: "/chat", icon: MessagesSquare },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Accounts", href: "/accounts", icon: BadgeDollarSign },
  { label: "Admin Console", href: "/admin", icon: ShieldCheck },
] as const;

export function getPortalPageTitle(pathname: string) {
  return (
    portalNavigation.find(
      ({ href }) => pathname === href || (href === "/admin" && pathname.startsWith("/admin/")),
    )?.label ?? "Dashboard"
  );
}
