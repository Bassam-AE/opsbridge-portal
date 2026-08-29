import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { MarketingPlaceholder } from "@/components/marketing/marketing-placeholder";
import { RESOURCES } from "@/lib/rbac/resources";

export default function MarketingPage() {
  return <ProtectedPortalPage resource={RESOURCES.MARKETING}><MarketingPlaceholder /></ProtectedPortalPage>;
}
