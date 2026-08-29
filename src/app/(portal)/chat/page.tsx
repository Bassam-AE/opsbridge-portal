import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { InternalChat } from "@/components/chat/internal-chat";
import { RESOURCES } from "@/lib/rbac/resources";

export default function InternalChatPage() {
  return <ProtectedPortalPage resource={RESOURCES.INTERNAL_CHAT}><InternalChat /></ProtectedPortalPage>;
}
