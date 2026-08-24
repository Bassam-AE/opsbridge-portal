"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { getCurrentSession } from "@/lib/auth/require-session";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import { createClient, setClientStatus, updateClient } from "@/services/clients";
import { ServiceMutationError } from "@/services/errors";
import { createUser, setUserStatus } from "@/services/users";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
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

function resultUrl(path: string, type: "notice" | "error", code: string): string {
  const params = new URLSearchParams({ [type]: code });
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
