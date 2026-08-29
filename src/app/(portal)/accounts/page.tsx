import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { AccountsPlaceholder } from "@/components/placeholders/module-list-placeholders";
import { RESOURCES } from "@/lib/rbac/resources";

export default function AccountsPage() {
  return <ProtectedPortalPage resource={RESOURCES.ACCOUNTS}><AccountsPlaceholder /></ProtectedPortalPage>;
}
