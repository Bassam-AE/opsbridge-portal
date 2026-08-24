import { describe, expect, it } from "vitest";

import { evaluateAuthorization } from "@/lib/rbac/authorize";
import { ACTIONS } from "@/lib/rbac/actions";
import { createPermissionKey } from "@/lib/rbac/permissions";
import { RESOURCES } from "@/lib/rbac/resources";
import type { AuthorizationFacts } from "@/lib/rbac/types";

const permission = createPermissionKey(RESOURCES.HRM, ACTIONS.VIEW);

const allowedByRole: AuthorizationFacts = {
  permission,
  permissionIsConfigured: true,
  sessionIsValid: true,
  userIsActive: true,
  clientScopeIsValid: true,
  hasUserRestriction: false,
  hasUserGrant: false,
  roleHasPermission: true,
};

describe("authorization precedence", () => {
  it("denies an invalid session before considering permissions", () => {
    expect(
      evaluateAuthorization({
        ...allowedByRole,
        sessionIsValid: false,
        hasUserGrant: true,
      }),
    ).toMatchObject({ allowed: false, reason: "invalid_session" });
  });

  it("denies a disabled user", () => {
    expect(
      evaluateAuthorization({ ...allowedByRole, userIsActive: false }),
    ).toMatchObject({ allowed: false, reason: "disabled_user" });
  });

  it("denies a request outside the user's client scope", () => {
    expect(
      evaluateAuthorization({
        ...allowedByRole,
        clientScopeIsValid: false,
        hasUserGrant: true,
      }),
    ).toMatchObject({ allowed: false, reason: "invalid_client_scope" });
  });

  it("denies a restriction even when a grant and role permission exist", () => {
    expect(
      evaluateAuthorization({
        ...allowedByRole,
        hasUserRestriction: true,
        hasUserGrant: true,
      }),
    ).toMatchObject({ allowed: false, reason: "user_restriction" });
  });

  it("allows a user-specific grant without a role permission", () => {
    expect(
      evaluateAuthorization({
        ...allowedByRole,
        hasUserGrant: true,
        roleHasPermission: false,
      }),
    ).toEqual({ allowed: true, reason: "user_grant", permission });
  });

  it("allows a matching role permission", () => {
    expect(evaluateAuthorization(allowedByRole)).toEqual({
      allowed: true,
      reason: "role_permission",
      permission,
    });
  });

  it("denies by default when no permission source matches", () => {
    expect(
      evaluateAuthorization({ ...allowedByRole, roleHasPermission: false }),
    ).toMatchObject({ allowed: false, reason: "missing_permission" });
  });

  it("denies an unconfigured permission definition", () => {
    expect(
      evaluateAuthorization({
        ...allowedByRole,
        permissionIsConfigured: false,
      }),
    ).toMatchObject({
      allowed: false,
      reason: "invalid_permission_definition",
    });
  });
});
