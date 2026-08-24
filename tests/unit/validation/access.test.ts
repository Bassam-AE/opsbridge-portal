import { describe, expect, it } from "vitest";

import {
  accessLogListInputSchema,
  createClientInputSchema,
  createUserInputSchema,
  paginatedListInputSchema,
  setClientStatusInputSchema,
  setUserStatusInputSchema,
  updateClientInputSchema,
} from "@/lib/validation/access";

const sessionId = "1b8ad890-f4d8-4e3f-b9ba-69ea1ecbe099";

describe("access service validation", () => {
  it("applies safe list defaults and normalizes search text", () => {
    expect(
      paginatedListInputSchema.parse({ sessionId, search: "  admin  " }),
    ).toEqual({
      sessionId,
      search: "admin",
      limit: 20,
      offset: 0,
    });
  });

  it("rejects invalid session identifiers", () => {
    expect(
      paginatedListInputSchema.safeParse({ sessionId: "not-a-session" }).success,
    ).toBe(false);
  });

  it("rejects unsafe pagination ranges", () => {
    expect(
      paginatedListInputSchema.safeParse({ sessionId, limit: 101 }).success,
    ).toBe(false);
    expect(
      accessLogListInputSchema.safeParse({ sessionId, offset: -1 }).success,
    ).toBe(false);
  });

  it("normalizes valid user creation input", () => {
    expect(
      createUserInputSchema.parse({
        sessionId,
        displayName: "  Jane Doe  ",
        email: "  JANE@EXAMPLE.COM ",
        username: "  Jane.Doe  ",
        accountType: "internal",
        roleId: "f59c362b-8504-4d71-b0f2-c3da9708fa74",
        clientId: "",
      }),
    ).toMatchObject({
      displayName: "Jane Doe",
      email: "jane@example.com",
      username: "jane.doe",
      accountType: "internal",
      clientId: undefined,
    });
  });

  it("enforces the account type and client relationship", () => {
    const base = {
      sessionId,
      displayName: "Jane Doe",
      email: "jane@example.com",
      username: "",
      roleId: "f59c362b-8504-4d71-b0f2-c3da9708fa74",
    };

    expect(
      createUserInputSchema.safeParse({ ...base, accountType: "client", clientId: "" })
        .success,
    ).toBe(false);
    expect(
      createUserInputSchema.safeParse({
        ...base,
        accountType: "internal",
        clientId: "33dbb9b0-8375-494c-a930-75550494b4f6",
      }).success,
    ).toBe(false);
  });

  it("normalizes and validates client company fields", () => {
    const parsed = createClientInputSchema.parse({
      sessionId,
      clientCode: " acme-in ",
      name: " Acme India ",
      countryCode: " in ",
      clientType: " Private Limited ",
    });

    expect(parsed).toMatchObject({
      clientCode: "ACME-IN",
      name: "Acme India",
      countryCode: "IN",
      clientType: "Private Limited",
    });
    expect(
      createClientInputSchema.safeParse({ ...parsed, countryCode: "India" }).success,
    ).toBe(false);
  });

  it("requires valid identifiers for update and lifecycle mutations", () => {
    expect(
      updateClientInputSchema.safeParse({
        sessionId,
        clientId: "invalid",
        clientCode: "ACME",
        name: "Acme",
        countryCode: "IN",
        clientType: "Private",
      }).success,
    ).toBe(false);
    expect(
      setClientStatusInputSchema.safeParse({
        sessionId,
        clientId: "invalid",
        status: "inactive",
      }).success,
    ).toBe(false);
    expect(
      setUserStatusInputSchema.safeParse({
        sessionId,
        targetUserId: "invalid",
        status: "disabled",
      }).success,
    ).toBe(false);
  });
});
