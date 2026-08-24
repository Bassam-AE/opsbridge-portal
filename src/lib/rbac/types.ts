import type { Action } from "./actions";
import type { PermissionKey } from "./permissions";
import type { Resource } from "./resources";

export type AuthorizationRequest = {
  sessionId: string;
  clientId: string | null;
  resource: Resource;
  action: Action;
};

export type AuthorizationFacts = {
  permission: PermissionKey | null;
  permissionIsConfigured: boolean;
  sessionIsValid: boolean;
  userIsActive: boolean;
  clientScopeIsValid: boolean;
  hasUserRestriction: boolean;
  hasUserGrant: boolean;
  roleHasPermission: boolean;
};

export type AuthorizationAllowReason = "user_grant" | "role_permission";

export type AuthorizationDenyReason =
  | "invalid_session"
  | "disabled_user"
  | "invalid_client_scope"
  | "user_restriction"
  | "missing_permission"
  | "invalid_permission_definition"
  | "authorization_error";

export type AuthorizationDecision =
  | {
      allowed: true;
      reason: AuthorizationAllowReason;
      permission: PermissionKey;
    }
  | {
      allowed: false;
      reason: AuthorizationDenyReason;
      permission: PermissionKey | null;
    };

export type PermissionEffect = "grant" | "restriction";
