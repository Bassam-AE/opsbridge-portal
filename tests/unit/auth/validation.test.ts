import { describe, expect, it } from "vitest";

import { loginInputSchema } from "@/lib/validation/auth";

describe("login input validation", () => {
  it("normalizes a username", () => {
    const result = loginInputSchema.parse({ username: " Admin ", password: "admin" });

    expect(result).toEqual({ username: "admin", password: "admin" });
  });

  it("rejects missing credentials", () => {
    expect(loginInputSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });
});
