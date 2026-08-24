import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findSession, sessionCookieName } from "@/lib/auth/session";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return findSession(token);
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
