import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import {
  invalidateSession,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    const userId = await invalidateSession(token);

    if (userId) {
      await db.insert(auditLogs).values({
        actorUserId: userId,
        eventType: "auth.logout",
        resource: "sessions",
        action: "delete",
        outcome: "success",
      });
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(sessionCookieName, "", {
    ...sessionCookieOptions,
    expires: new Date(0),
  });

  return response;
}
