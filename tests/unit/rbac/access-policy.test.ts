import { describe, expect, it } from "vitest";

import {
  accountTypeCanAccessResource,
  overrideScopeMatchesAccount,
  roleAudienceCanReceiveResource,
} from "@/lib/rbac/access-policy";
import { RESOURCES } from "@/lib/rbac/resources";

describe("access policy scope rules", () => {
  it("limits client accounts to their approved company modules", () => {
    expect(accountTypeCanAccessResource("client", RESOURCES.DASHBOARD)).toBe(true);
    expect(accountTypeCanAccessResource("client", RESOURCES.CRM)).toBe(true);
    expect(accountTypeCanAccessResource("client", RESOURCES.HRM)).toBe(true);
    expect(accountTypeCanAccessResource("client", RESOURCES.VMS)).toBe(true);
    expect(accountTypeCanAccessResource("client", RESOURCES.VAULT)).toBe(true);
    expect(accountTypeCanAccessResource("client", RESOURCES.ACCOUNTS)).toBe(true);
    expect(accountTypeCanAccessResource("client", RESOURCES.CLIENTS)).toBe(false);
    expect(accountTypeCanAccessResource("client", RESOURCES.BMS)).toBe(false);
    expect(accountTypeCanAccessResource("client", RESOURCES.MARKETING)).toBe(false);
    expect(accountTypeCanAccessResource("client", RESOURCES.INTERNAL_CHAT)).toBe(false);
    expect(accountTypeCanAccessResource("internal", RESOURCES.CLIENTS)).toBe(true);
  });

  it("keeps provider resources out of client roles", () => {
    expect(roleAudienceCanReceiveResource("client", RESOURCES.ADMIN_CONSOLE)).toBe(false);
    expect(roleAudienceCanReceiveResource("client", RESOURCES.HRM)).toBe(true);
    expect(roleAudienceCanReceiveResource("client", RESOURCES.CLIENTS)).toBe(false);
    expect(roleAudienceCanReceiveResource("client", RESOURCES.BMS)).toBe(false);
    expect(roleAudienceCanReceiveResource("internal", RESOURCES.ADMIN_CONSOLE)).toBe(true);
  });

  it("keeps user-management overrides inside the applicable account scope", () => {
    const clientId = crypto.randomUUID();
    expect(overrideScopeMatchesAccount("internal", RESOURCES.USERS, null)).toBe(true);
    expect(overrideScopeMatchesAccount("internal", RESOURCES.USERS, clientId)).toBe(true);
    expect(overrideScopeMatchesAccount("client", RESOURCES.USERS, null)).toBe(false);
    expect(overrideScopeMatchesAccount("client", RESOURCES.USERS, clientId)).toBe(true);
  });

  it("requires a client for client resources and client users", () => {
    const clientId = crypto.randomUUID();
    expect(overrideScopeMatchesAccount("internal", RESOURCES.HRM, clientId)).toBe(true);
    expect(overrideScopeMatchesAccount("internal", RESOURCES.HRM, null)).toBe(false);
    expect(overrideScopeMatchesAccount("client", RESOURCES.DASHBOARD, null)).toBe(false);
    expect(overrideScopeMatchesAccount("client", RESOURCES.DASHBOARD, clientId)).toBe(true);
  });
});
