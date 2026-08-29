import { describe, expect, it } from "vitest";

import {
  createUserPermissionOverrideInputSchema,
  replaceRolePermissionsInputSchema,
  updateUserPermissionOverrideInputSchema,
} from "@/lib/validation/access-management";

const sessionId = "1b8ad890-f4d8-4e3f-b9ba-69ea1ecbe099";
const userId = "f59c362b-8504-4d71-b0f2-c3da9708fa74";
const permissionId = "33dbb9b0-8375-494c-a930-75550494b4f6";

describe("access-management validation", () => {
  it("deduplicates submitted role permissions", () => {
    expect(
      replaceRolePermissionsInputSchema.parse({
        sessionId,
        roleId: userId,
        permissionIds: [permissionId, permissionId],
      }).permissionIds,
    ).toEqual([permissionId]);
  });

  it("normalizes provider scope and future expiry", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const result = createUserPermissionOverrideInputSchema.parse({
      sessionId,
      userId,
      clientId: "",
      permissionId,
      effect: "grant",
      reason: "Temporary access",
      expiresAt: future,
    });

    expect(result.clientId).toBeNull();
    expect(result.expiresAt).toBe(future);
  });

  it("treats browser datetime-local values as explicitly labeled UTC", () => {
    const futureMinute = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    const result = createUserPermissionOverrideInputSchema.parse({
      sessionId,
      userId,
      clientId: "",
      permissionId,
      effect: "grant",
      reason: "Temporary access",
      expiresAt: futureMinute,
    });

    expect(result.expiresAt).toBe(`${futureMinute}:00.000Z`);
  });

  it("rejects expired overrides and short reasons", () => {
    expect(
      updateUserPermissionOverrideInputSchema.safeParse({
        sessionId,
        overrideId: userId,
        effect: "restriction",
        reason: "no",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }).success,
    ).toBe(false);
  });
});
