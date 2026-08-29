import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { VaultBrowser } from "@/components/vault/vault-browser";
import { RESOURCES } from "@/lib/rbac/resources";

export default function VaultPage() {
  return <ProtectedPortalPage resource={RESOURCES.VAULT}><VaultBrowser /></ProtectedPortalPage>;
}
