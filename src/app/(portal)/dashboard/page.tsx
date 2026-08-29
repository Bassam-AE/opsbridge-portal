import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { RESOURCES } from "@/lib/rbac/resources";

export default function DashboardPage() {
  return <ProtectedPortalPage resource={RESOURCES.DASHBOARD}>{null}</ProtectedPortalPage>;
}
