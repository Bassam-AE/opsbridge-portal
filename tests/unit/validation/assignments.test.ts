import { describe, expect, it } from "vitest";

import {
  clientContextInputSchema,
  createClientMembershipInputSchema,
  createEmployeeAssignmentInputSchema,
  setEmployeeAssignmentStatusInputSchema,
  updateClientMembershipInputSchema,
} from "@/lib/validation/assignments";

const ids = {
  sessionId: "1b8ad890-f4d8-4e3f-b9ba-69ea1ecbe099",
  userId: "f59c362b-8504-4d71-b0f2-c3da9708fa74",
  clientId: "33dbb9b0-8375-494c-a930-75550494b4f6",
  roleId: "2fe0f2f2-7a4c-4075-956a-a2c90e7ed78f",
};

describe("assignment validation", () => {
  it("accepts valid employee assignments and client memberships", () => {
    expect(createEmployeeAssignmentInputSchema.parse(ids)).toEqual(ids);
    expect(createClientMembershipInputSchema.parse(ids)).toEqual(ids);
  });

  it("rejects malformed assignment identifiers and lifecycle values", () => {
    expect(
      createEmployeeAssignmentInputSchema.safeParse({ ...ids, userId: "invalid" }).success,
    ).toBe(false);
    expect(
      setEmployeeAssignmentStatusInputSchema.safeParse({
        sessionId: ids.sessionId,
        assignmentId: ids.clientId,
        status: "deleted",
      }).success,
    ).toBe(false);
    expect(
      updateClientMembershipInputSchema.safeParse({
        sessionId: ids.sessionId,
        membershipId: "invalid",
        clientId: ids.clientId,
        roleId: ids.roleId,
      }).success,
    ).toBe(false);
  });

  it("normalizes an empty provider context to null", () => {
    expect(
      clientContextInputSchema.parse({ sessionId: ids.sessionId, clientId: "" }),
    ).toEqual({ sessionId: ids.sessionId, clientId: null });
  });
});
