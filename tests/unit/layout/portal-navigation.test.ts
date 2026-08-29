import { describe, expect, it } from "vitest";

import {
  getPortalPageTitle,
  portalNavigation,
} from "@/components/layout/portal-navigation";
import { resolveResourceClientId } from "@/lib/rbac/portal-access-policy";
import { RESOURCES } from "@/lib/rbac/resources";

describe("portal page titles", () => {
  it("keeps Admin Console active on drill-down routes", () => {
    expect(getPortalPageTitle("/admin/users")).toBe("Admin Console");
    expect(getPortalPageTitle("/admin/access")).toBe("Admin Console");
  });

  it("maps every visible route to a unique canonical resource", () => {
    expect(new Set(portalNavigation.map(({ href }) => href)).size).toBe(
      portalNavigation.length,
    );
    expect(new Set(portalNavigation.map(({ resource }) => resource)).size).toBe(
      portalNavigation.length,
    );
  });

  it("uses provider scope only for provider resources", () => {
    const clientId = crypto.randomUUID();

    expect(resolveResourceClientId(RESOURCES.INTERNAL_CHAT, clientId)).toBeNull();
    expect(resolveResourceClientId(RESOURCES.ADMIN_CONSOLE, clientId)).toBeNull();
    expect(resolveResourceClientId(RESOURCES.HRM, clientId)).toBe(clientId);
    expect(resolveResourceClientId(RESOURCES.DASHBOARD, clientId)).toBe(clientId);
    expect(resolveResourceClientId(RESOURCES.DASHBOARD, null)).toBeNull();
  });
});
