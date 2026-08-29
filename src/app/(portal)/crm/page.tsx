import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { CrmPlaceholder } from "@/components/placeholders/module-list-placeholders";
import { RESOURCES } from "@/lib/rbac/resources";

export default function CrmPage() {
  return <ProtectedPortalPage resource={RESOURCES.CRM}><CrmPlaceholder /></ProtectedPortalPage>;
}
