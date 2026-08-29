import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { loginInputSchema } from "@/lib/validation/auth";
import {
  clientContextCookieName,
  clientContextCookieOptions,
} from "@/lib/client-context";

const LOGIN_ERROR_PATH = "/login?error=invalid_credentials";
const FALLBACK_PASSWORD_HASH = [
  "scrypt-v1",
  "32768",
  "8",
  "1",
  Buffer.alloc(16).toString("base64url"),
  Buffer.alloc(64).toString("base64url"),
].join("$");

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

async function readInput(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  return {
    username: formData.get("username"),
    password: formData.get("password"),
  };
}

export async function POST(request: Request) {
  const acceptsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  const parsedInput = loginInputSchema.safeParse(await readInput(request));

  if (!parsedInput.success) {
    return acceptsJson
      ? NextResponse.json({ error: "Invalid login details." }, { status: 400 })
      : redirectTo(request, LOGIN_ERROR_PATH);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, parsedInput.data.username))
    .limit(1);

  const passwordIsValid = await verifyPassword(
    parsedInput.data.password,
    user?.passwordHash ?? FALLBACK_PASSWORD_HASH,
  );

  if (!user || !user.passwordHash || user.status !== "active" || !passwordIsValid) {
    await db.insert(auditLogs).values({
      actorUserId: user?.id,
      eventType: "auth.login",
      resource: "sessions",
      action: "create",
      outcome: "denied",
      reason: "Invalid credentials or inactive account.",
    });

    return acceptsJson
      ? NextResponse.json({ error: "Invalid username or password." }, { status: 401 })
      : redirectTo(request, LOGIN_ERROR_PATH);
  }

  const session = await createSession(user.id);

  await db.insert(auditLogs).values({
    actorUserId: user.id,
    eventType: "auth.login",
    resource: "sessions",
    action: "create",
    targetType: "session",
    outcome: "success",
  });

  const response = acceptsJson
    ? NextResponse.json({ ok: true })
    : redirectTo(request, "/dashboard");

  response.cookies.set(sessionCookieName, session.token, {
    ...sessionCookieOptions,
    expires: session.expiresAt,
  });
  response.cookies.set(clientContextCookieName, "", {
    ...clientContextCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
