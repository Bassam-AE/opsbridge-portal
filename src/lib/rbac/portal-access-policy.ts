import { RESOURCE_DEFINITIONS, type Resource } from "@/lib/rbac/resources";

export function resolveResourceClientId(
  resource: Resource,
  currentClientId: string | null,
): string | null {
  return RESOURCE_DEFINITIONS[resource].scope === "provider"
    ? null
    : currentClientId;
}
