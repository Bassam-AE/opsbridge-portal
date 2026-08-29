import { type NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import {
  invalidateSession,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  clientContextCookieName,
  clientContextCookieOptions,
} from "@/lib/client-context";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

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
  response.cookies.set(clientContextCookieName, "", {
    ...clientContextCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
