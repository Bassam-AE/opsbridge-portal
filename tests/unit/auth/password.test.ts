import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("accepts the matching password and rejects a different password", async () => {
    const passwordHash = await hashPassword("admin");

    await expect(verifyPassword("admin", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("not-admin", passwordHash)).resolves.toBe(false);
  });

  it("rejects malformed password hashes", async () => {
    await expect(verifyPassword("admin", "not-a-password-hash")).resolves.toBe(false);
  });
});
