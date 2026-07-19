// Minimal shared-password "gate" using an HMAC-signed cookie.
// Works in both the Node and Edge (middleware) runtimes via Web Crypto.

export const SESSION_COOKIE = "backlog_session";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  // A real secret must be set in production; a dev fallback keeps local dev working.
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

export function getSitePassword(): string {
  return process.env.SITE_PASSWORD || "changeme";
}

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(signature);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Create a signed session token that expires after `ttlMs`. */
export async function createSessionToken(ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const exp = Date.now() + ttlMs;
  const sig = await hmac(String(exp));
  return `${exp}.${sig}`;
}

/** Verify a session token's signature and expiry. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const expPart = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expPart);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(expPart);
  return safeEqual(expected, sig);
}

export const SESSION_MAX_AGE_SECONDS = Math.floor(DEFAULT_TTL_MS / 1000);
