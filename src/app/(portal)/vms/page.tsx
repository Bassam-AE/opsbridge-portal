import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { VmsPlaceholder } from "@/components/placeholders/module-list-placeholders";
import { RESOURCES } from "@/lib/rbac/resources";

export default function VmsPage() {
  return <ProtectedPortalPage resource={RESOURCES.VMS}><VmsPlaceholder /></ProtectedPortalPage>;
}
