import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { BmsPlaceholder } from "@/components/placeholders/module-list-placeholders";
import { RESOURCES } from "@/lib/rbac/resources";

export default function BmsPage() {
  return <ProtectedPortalPage resource={RESOURCES.BMS}><BmsPlaceholder /></ProtectedPortalPage>;
}
