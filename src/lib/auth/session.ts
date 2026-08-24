import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const DEFAULT_SESSION_TTL_HOURS = 12;

function readSessionTtlHours(): number {
  const configuredValue = Number(process.env.SESSION_TTL_HOURS ?? DEFAULT_SESSION_TTL_HOURS);

  if (!Number.isInteger(configuredValue) || configuredValue < 1 || configuredValue > 720) {
    throw new Error("SESSION_TTL_HOURS must be an integer between 1 and 720.");
  }

  return configuredValue;
}

export const sessionCookieName =
  process.env.SESSION_COOKIE_NAME ?? "service_portal_session";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export type AuthenticatedSession = {
  id: string;
  expiresAt: string;
  user: {
    id: string;
    username: string | null;
    email: string;
    displayName: string;
    accountType: "internal" | "client";
  };
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + readSessionTtlHours() * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: expiresAt.toISOString(),
    lastSeenAt: now.toISOString(),
    createdAt: now.toISOString(),
  });

  return { token, expiresAt };
}

export async function findSession(token: string): Promise<AuthenticatedSession | null> {
  const now = new Date().toISOString();
  const [result] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      accountType: users.accountType,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        gt(sessions.expiresAt, now),
        isNull(sessions.invalidatedAt),
        eq(users.status, "active"),
      ),
    )
    .limit(1);

  if (!result) {
    return null;
  }

  await db
    .update(sessions)
    .set({ lastSeenAt: now })
    .where(eq(sessions.id, result.sessionId));

  return {
    id: result.sessionId,
    expiresAt: result.expiresAt,
    user: {
      id: result.userId,
      username: result.username,
      email: result.email,
      displayName: result.displayName,
      accountType: result.accountType,
    },
  };
}

export async function invalidateSession(token: string): Promise<string | null> {
  const tokenHash = hashSessionToken(token);
  const [session] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.invalidatedAt)))
    .limit(1);

  if (!session) {
    return null;
  }

  await db
    .update(sessions)
    .set({ invalidatedAt: new Date().toISOString() })
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.invalidatedAt),
      ),
    );

  return session.userId;
}
