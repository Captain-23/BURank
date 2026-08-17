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
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:420px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">

          <tr>
            <td style="padding:40px 36px;">

              <p style="margin:0 0 28px;font-size:11px;font-weight:500;
                color:#9ca3af;letter-spacing:0.12em;">
                BURANK
              </p>

              <p style="margin:0 0 10px;font-size:20px;font-weight:600;color:#111827;line-height:1.3;">
                Sign in
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
                Click the button to continue. This link expires in 15 minutes
                and works once.
              </p>

              <a href="${url}"
                style="display:inline-block;padding:10px 22px;
                border:1px solid #111827;color:#111827;font-size:14px;
                font-weight:500;text-decoration:none;border-radius:6px;">
                Continue to BURank
              </a>

              <p style="margin:36px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                ${email}<br/>
                If you didn't request this, you can ignore this email.
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
