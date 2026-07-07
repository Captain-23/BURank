import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── validate bennett email ───────────────────────────────────────────────────
function isBennettEmail(email: string): boolean {
  // Domain restriction intentionally disabled for now — any email may sign in.
  // To re-enable Bennett-only sign-in, restore:
  //   return email.trim().toLowerCase().endsWith("@bennett.edu.in");
  return true;
}

// ─── NextAuth config ──────────────────────────────────────────────────────────
const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // We override sendVerificationRequest so we use Resend
      // instead of the default nodemailer transport
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // Double-check server-side even if client already validated
        if (!isBennettEmail(email)) {
          throw new Error("Only @bennett.edu.in emails are allowed.");
        }

        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: "Your BURank sign-in link",
          html: magicLinkEmail(url, email),
        });

        if (error) {
          console.error("Resend error:", error);
          throw error;
        }
      },
    }),
  ],

  // ─── use JWT for sessions — no database needed ──────────────────────────
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ─── JWT stored in a cookie — no Redis, no DB ───────────────────────────
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  // ─── custom pages ────────────────────────────────────────────────────────
  pages: {
    signIn: "/auth/signin", // our custom sign-in page
    verifyRequest: "/auth/verify", // "check your email" page
    error: "/auth/error", // error page
    // first-time users go here
    newUser: "/",
  },

  // ─── callbacks ───────────────────────────────────────────────────────────
  callbacks: {
    // Block anyone without a bennett email at the session level too
    async signIn({ user }) {
      if (!user.email || !isBennettEmail(user.email)) {
        return false; // blocks the sign-in
      }
      return true;
    },

    // Attach email to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },

    // Attach email to the session object so the frontend can read it
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

// ─── magic link email HTML ────────────────────────────────────────────────────
function magicLinkEmail(url: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#111118;border:1px solid #1E1E2E;border-radius:8px;overflow:hidden;">

          <!-- Red top bar -->
          <tr>
            <td style="height:3px;background:#C8102E;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Wordmark -->
              <p style="margin:0 0 32px;font-size:20px;font-weight:700;
                color:#E2E2F0;font-family:'JetBrains Mono',monospace;
                border-bottom:1px solid #1E1E2E;padding-bottom:20px;">
                BU<span style="color:#C8102E;">Rank</span>
              </p>

              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#E2E2F0;">
                Sign in to BURank
              </p>
              <p style="margin:0 0 28px;font-size:13px;color:#8888A8;line-height:1.6;">
                Click the button below to sign in to your BURank account.
                This link expires in <strong style="color:#E2E2F0;">15 minutes</strong>
                and can only be used once.
              </p>

              <!-- CTA button -->
              <a href="${url}"
                style="display:inline-block;padding:12px 28px;
                background:#C8102E;color:#ffffff;font-size:14px;
                font-weight:600;text-decoration:none;border-radius:6px;">
                Sign in to BURank
              </a>

              <!-- Divider -->
              <p style="margin:28px 0 0;padding-top:20px;
                border-top:1px solid #1E1E2E;
                font-size:11px;color:#555570;line-height:1.6;">
                Signing in as <strong style="color:#8888A8;">${email}</strong><br/>
                If you didn't request this, ignore this email — nothing will happen.<br/>
                This link works only once and expires in 15 minutes.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;border-top:1px solid #1E1E2E;
              background:rgba(255,255,255,0.01);">
              <p style="margin:0;font-size:11px;color:#2A2A3E;
                font-family:'JetBrains Mono',monospace;">
                Bennett University · LeetCode Leaderboard
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── export handler ───────────────────────────────────────────────────────────
export { authOptions };
export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  return session;
}

export function enrollmentFromEmail(email: string) {
  return email.split("@")[0]?.toLowerCase() ?? "";
}
