"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { getCurrentSession } from "@/lib/auth/require-session";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import {
  createClientMembership,
  createEmployeeAssignment,
  setClientMembershipStatus,
  setEmployeeAssignmentStatus,
  updateClientMembership,
  updateEmployeeAssignment,
} from "@/services/assignments";
import {
  createUserPermissionOverride,
  replaceRolePermissions,
  revokeUserPermissionOverride,
  updateUserPermissionOverride,
} from "@/services/access-management";
import { createClient, setClientStatus, updateClient } from "@/services/clients";
import { ServiceMutationError } from "@/services/errors";
import { createUser, setUserStatus } from "@/services/users";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function fields(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
}

function mutationErrorCode(error: unknown): string {
  if (error instanceof ZodError) {
    return "validation";
  }

  if (error instanceof ServiceMutationError) {
    return error.code;
  }

  if (error instanceof PermissionDeniedError) {
    return "permission_denied";
  }

  console.error("Admin Console mutation failed", error);
  return "unexpected";
}

function resultUrl(
  path: string,
  type: "notice" | "error",
  code: string,
  additionalParams: Record<string, string> = {},
): string {
  const params = new URLSearchParams({ ...additionalParams, [type]: code });
  return `${path}?${params.toString()}`;
}

export async function createUserAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await createUser({
      sessionId: session.id,
      displayName: field(formData, "displayName"),
      email: field(formData, "email"),
      username: field(formData, "username"),
      accountType: field(formData, "accountType"),
      roleId: field(formData, "roleId"),
      clientId: field(formData, "clientId"),
    });
  } catch (error) {
    redirect(resultUrl("/admin/users", "error", mutationErrorCode(error)));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit");
  redirect(resultUrl("/admin/users", "notice", "user_created"));
}

export async function setUserStatusAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await setUserStatus({
      sessionId: session.id,
      targetUserId: field(formData, "targetUserId"),
      status: field(formData, "status"),
    });
  } catch (error) {
    redirect(resultUrl("/admin/users", "error", mutationErrorCode(error)));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  redirect(resultUrl("/admin/users", "notice", "user_status_changed"));
}

export async function createClientAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await createClient({
      sessionId: session.id,
      clientCode: field(formData, "clientCode"),
      name: field(formData, "name"),
      countryCode: field(formData, "countryCode"),
      clientType: field(formData, "clientType"),
    });
  } catch (error) {
    redirect(resultUrl("/admin/clients", "error", mutationErrorCode(error)));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/audit");
  redirect(resultUrl("/admin/clients", "notice", "client_created"));
}

export async function updateClientAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await updateClient({
      sessionId: session.id,
      clientId: field(formData, "clientId"),
      clientCode: field(formData, "clientCode"),
      name: field(formData, "name"),
      countryCode: field(formData, "countryCode"),
      clientType: field(formData, "clientType"),
    });
  } catch (error) {
    redirect(resultUrl("/admin/clients", "error", mutationErrorCode(error)));
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin/audit");
  redirect(resultUrl("/admin/clients", "notice", "client_updated"));
}

export async function setClientStatusAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await setClientStatus({
      sessionId: session.id,
      clientId: field(formData, "clientId"),
      status: field(formData, "status"),
    });
  } catch (error) {
    redirect(resultUrl("/admin/clients", "error", mutationErrorCode(error)));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit");
  redirect(resultUrl("/admin/clients", "notice", "client_status_changed"));
}

function assignmentResultUrl(
  assignmentType: "employee" | "client",
  type: "notice" | "error",
  code: string,
) {
  return resultUrl("/admin/assignments", type, code, { type: assignmentType });
}

function revalidateAssignmentPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit");
}

export async function createEmployeeAssignmentAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await createEmployeeAssignment({
      sessionId: session.id,
      userId: field(formData, "userId"),
      clientId: field(formData, "clientId"),
      roleId: field(formData, "roleId"),
    });
  } catch (error) {
    redirect(assignmentResultUrl("employee", "error", mutationErrorCode(error)));
  }

  revalidateAssignmentPaths();
  redirect(assignmentResultUrl("employee", "notice", "assignment_created"));
}

export async function updateEmployeeAssignmentAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await updateEmployeeAssignment({
      sessionId: session.id,
      assignmentId: field(formData, "assignmentId"),
      roleId: field(formData, "roleId"),
    });
  } catch (error) {
    redirect(assignmentResultUrl("employee", "error", mutationErrorCode(error)));
  }

  revalidateAssignmentPaths();
  redirect(assignmentResultUrl("employee", "notice", "assignment_updated"));
}

export async function setEmployeeAssignmentStatusAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await setEmployeeAssignmentStatus({
      sessionId: session.id,
      assignmentId: field(formData, "assignmentId"),
      status: field(formData, "status"),
    });
  } catch (error) {
    redirect(assignmentResultUrl("employee", "error", mutationErrorCode(error)));
  }

  revalidateAssignmentPaths();
  redirect(
    assignmentResultUrl("employee", "notice", "assignment_status_changed"),
  );
}

export async function createClientMembershipAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await createClientMembership({
      sessionId: session.id,
      userId: field(formData, "userId"),
      clientId: field(formData, "clientId"),
      roleId: field(formData, "roleId"),
    });
  } catch (error) {
    redirect(assignmentResultUrl("client", "error", mutationErrorCode(error)));
  }

  revalidateAssignmentPaths();
  redirect(assignmentResultUrl("client", "notice", "membership_created"));
}

export async function updateClientMembershipAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await updateClientMembership({
      sessionId: session.id,
      membershipId: field(formData, "membershipId"),
      clientId: field(formData, "clientId"),
      roleId: field(formData, "roleId"),
    });
  } catch (error) {
    redirect(assignmentResultUrl("client", "error", mutationErrorCode(error)));
  }

  revalidateAssignmentPaths();
  redirect(assignmentResultUrl("client", "notice", "membership_updated"));
}

export async function setClientMembershipStatusAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await setClientMembershipStatus({
      sessionId: session.id,
      membershipId: field(formData, "membershipId"),
      status: field(formData, "status"),
    });
  } catch (error) {
    redirect(assignmentResultUrl("client", "error", mutationErrorCode(error)));
  }

  revalidateAssignmentPaths();
  redirect(
    assignmentResultUrl("client", "notice", "membership_status_changed"),
  );
}

function accessResultUrl(type: "notice" | "error", code: string) {
  return resultUrl("/admin/access", type, code);
}

function revalidateAccessPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/access");
  revalidatePath("/admin/audit");
}

export async function replaceRolePermissionsAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await replaceRolePermissions({
      sessionId: session.id,
      roleId: field(formData, "roleId"),
      permissionIds: fields(formData, "permissionIds"),
    });
  } catch (error) {
    redirect(accessResultUrl("error", mutationErrorCode(error)));
  }

  revalidateAccessPaths();
  redirect(accessResultUrl("notice", "role_permissions_updated"));
}

export async function createUserPermissionOverrideAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await createUserPermissionOverride({
      sessionId: session.id,
      userId: field(formData, "userId"),
      clientId: field(formData, "clientId"),
      permissionId: field(formData, "permissionId"),
      effect: field(formData, "effect"),
      reason: field(formData, "reason"),
      expiresAt: field(formData, "expiresAt"),
    });
  } catch (error) {
    redirect(accessResultUrl("error", mutationErrorCode(error)));
  }

  revalidateAccessPaths();
  redirect(accessResultUrl("notice", "override_created"));
}

export async function updateUserPermissionOverrideAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await updateUserPermissionOverride({
      sessionId: session.id,
      overrideId: field(formData, "overrideId"),
      effect: field(formData, "effect"),
      reason: field(formData, "reason"),
      expiresAt: field(formData, "expiresAt"),
    });
  } catch (error) {
    redirect(accessResultUrl("error", mutationErrorCode(error)));
  }

  revalidateAccessPaths();
  redirect(accessResultUrl("notice", "override_updated"));
}

export async function revokeUserPermissionOverrideAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await revokeUserPermissionOverride({
      sessionId: session.id,
      overrideId: field(formData, "overrideId"),
    });
  } catch (error) {
    redirect(accessResultUrl("error", mutationErrorCode(error)));
  }

  revalidateAccessPaths();
  redirect(accessResultUrl("notice", "override_revoked"));
}
