"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { getCurrentSession } from "@/lib/auth/require-session";
import { requirePortalPageView } from "@/lib/rbac/portal-page-access";
import { PermissionDeniedError } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import { createCompanyUser } from "@/services/company-users";
import { ServiceMutationError } from "@/services/errors";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function errorCode(error: unknown): string {
  if (error instanceof ZodError) return "validation";
  if (error instanceof ServiceMutationError) return error.code;
  if (error instanceof PermissionDeniedError) return "permission_denied";

  console.error("Company user creation failed", error);
  return "unexpected";
}

export async function createCompanyUserAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  try {
    await requirePortalPageView(RESOURCES.USERS);
    await createCompanyUser({
      sessionId: session.id,
      displayName: field(formData, "displayName"),
      email: field(formData, "email"),
      username: field(formData, "username"),
    });
  } catch (error) {
    redirect(`/company/users?error=${errorCode(error)}`);
  }

  revalidatePath("/company/users");
  revalidatePath("/admin/users");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit");
  redirect("/company/users?notice=user_created");
}
