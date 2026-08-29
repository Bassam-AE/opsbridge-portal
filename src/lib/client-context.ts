export const clientContextCookieName = "portal_client_context";

export const clientContextCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export type ClientContextOption = {
  id: string;
  code: string;
  name: string;
};

export function resolveClientContext(
  accountType: "internal" | "client",
  requestedClientId: string | undefined,
  contexts: readonly ClientContextOption[],
): string | null {
  if (accountType === "client") {
    return contexts[0]?.id ?? null;
  }

  return contexts.some(({ id }) => id === requestedClientId)
    ? (requestedClientId ?? null)
    : null;
}
