import { createHmac, timingSafeEqual } from "crypto";

// Signed, expiring admin session token stored in an httpOnly cookie.
// Format: `${expiryUnixSeconds}.${hmacSha256(expiry)}`.
// The signing key is a server-only secret; a leaked or guessed cookie name is
// useless without it, so the session can't be forged (unlike a static string).

const TTL_SECONDS = 60 * 60 * 24 * 7; // 1 week

function signingKey(): string | null {
  // Dedicated secret if provided, else derive from the admin password so no
  // extra env var is strictly required. Fails closed if neither is set.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

/** Returns a signed session token, or null if the server isn't configured. */
export function createAdminToken(): string | null {
  const key = signingKey();
  if (!key) return null;
  const exp = String(Math.floor(Date.now() / 1000) + TTL_SECONDS);
  return `${exp}.${sign(exp, key)}`;
}

/** True only for a token with a valid signature that hasn't expired. */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const key = signingKey();
  if (!key) return false;

  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(exp, key);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  const expNum = parseInt(exp, 10);
  if (Number.isNaN(expNum)) return false;
  return expNum > Math.floor(Date.now() / 1000);
}
