import { randomUUID } from "node:crypto";

const SESSION_COOKIE = "nova-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Reads the session cookie from the request. If none exists, a new session ID
 * is generated. The Set-Cookie header must be applied to the response by the
 * caller — we return it as a string so route loaders/actions can attach it.
 */
export async function getSessionId(
  request: Request,
): Promise<string> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const existing = cookies[SESSION_COOKIE];
  if (existing) return existing;

  // No session yet — generate one and stash it on the request so that the
  // same request object always returns the same new ID within one handler.
  const key = "__nova_new_session__";
  const r = request as Request & { [key]: string | undefined };
  if (!r[key]) r[key] = randomUUID();
  return r[key] as string;
}

/**
 * Builds a Set-Cookie string for a new session ID.
 * Call this when you detect getSessionId returned a freshly generated UUID
 * (i.e. the request had no session cookie).
 */
export function buildSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

/**
 * Returns both the sessionId and, if a new cookie needs to be set, the
 * Set-Cookie header value. Attach the cookie to every response that uses
 * the session so the browser stores it.
 */
export async function getOrCreateSession(
  request: Request,
): Promise<{ sessionId: string; setCookie: string | null }> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const existing = cookies[SESSION_COOKIE];

  if (existing) return { sessionId: existing, setCookie: null };

  const key = "__nova_new_session__";
  const r = request as Request & { [key]: string | undefined };
  if (!r[key]) r[key] = randomUUID();
  const sessionId = r[key] as string;

  return {
    sessionId,
    setCookie: buildSessionCookie(sessionId),
  };
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    result[key] = decodeURIComponent(value);
  }
  return result;
}
