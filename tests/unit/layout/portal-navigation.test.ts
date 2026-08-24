import { describe, expect, it } from "vitest";

import { getPortalPageTitle } from "@/components/layout/portal-navigation";

describe("portal page titles", () => {
  it("keeps Admin Console active on drill-down routes", () => {
    expect(getPortalPageTitle("/admin/users")).toBe("Admin Console");
    expect(getPortalPageTitle("/admin/access")).toBe("Admin Console");
  });
});
