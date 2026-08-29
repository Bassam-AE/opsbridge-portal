"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  clientContextCookieName,
  clientContextCookieOptions,
} from "@/lib/client-context";
import { getCurrentSession } from "@/lib/auth/require-session";
import { validateClientContextSelection } from "@/services/client-context";

export async function setClientContextAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const rawClientId = formData.get("clientId");
  const selectedClientId = await validateClientContextSelection({
    sessionId: session.id,
    clientId: typeof rawClientId === "string" ? rawClientId : "",
  });
  const cookieStore = await cookies();

  if (selectedClientId) {
    cookieStore.set(
      clientContextCookieName,
      selectedClientId,
      clientContextCookieOptions,
    );
  } else {
    cookieStore.delete(clientContextCookieName);
  }

  revalidatePath("/", "layout");
}

export async function enterClientPortalAction(formData: FormData) {
  await setClientContextAction(formData);
  redirect("/dashboard");
}

export async function returnToProviderPortalAction() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  await validateClientContextSelection({ sessionId: session.id, clientId: "" });
  const cookieStore = await cookies();
  cookieStore.delete(clientContextCookieName);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
