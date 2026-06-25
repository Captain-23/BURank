import { cookies } from "next/headers";
import * as crypto from "crypto";

// Super simple session management since we have no DB.
// We just store the username in an HTTP-only cookie.
// In a real app, use JWT. For this simple app, we just sign the username with a secret.

const SECRET = process.env.SESSION_SECRET || "bennett_leetcode_secret_key_12345";

export function createSessionCookie(username: string) {
  // Simple signature to prevent tampering
  const signature = crypto.createHmac("sha256", SECRET).update(username).digest("hex");
  const value = `${username}.${signature}`;
  
  cookies().set("user_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export function getUserFromSession(): string | null {
  const session = cookies().get("user_session")?.value;
  if (!session) return null;
  
  const [username, signature] = session.split(".");
  if (!username || !signature) return null;
  
  const expectedSignature = crypto.createHmac("sha256", SECRET).update(username).digest("hex");
  if (signature !== expectedSignature) return null;
  
  return username;
}

export function clearSessionCookie() {
  cookies().set("user_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export function hashPassword(password: string): string {
  // Simple SHA-256 hash
  return crypto.createHash("sha256").update(password).digest("hex");
}
