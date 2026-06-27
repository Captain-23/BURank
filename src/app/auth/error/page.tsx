"use client";

// src/app/auth/error/page.tsx
// NextAuth redirects here when something goes wrong.
// The error type is passed as a query param: ?error=AccessDenied etc.

import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Only @bennett.edu.in email addresses can sign in to BUrge.",
  Verification:
    "This sign-in link has expired or has already been used. Please request a new one.",
  Configuration:
    "There is a server configuration issue. Please contact the admin.",
  Default: "Something went wrong during sign-in. Please try again.",
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const errorCode = params.get("error") ?? "Default";
  const message = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <p
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: "#E2E2F0",
            margin: "0 0 32px",
          }}
        >
          BU<span style={{ color: "#C8102E" }}>rge</span>
        </p>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(255,55,95,0.12)",
            border: "1px solid rgba(255,55,95,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 22,
            color: "#FF375F",
          }}
        >
          ✕
        </div>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#E2E2F0",
            margin: "0 0 10px",
          }}
        >
          Sign-in failed
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "#8888A8",
            margin: "0 0 28px",
            lineHeight: 1.7,
          }}
        >
          {message}
        </p>

        <a
          href="/auth/signin"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#C8102E",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Try again
        </a>
      </div>
    </div>
  );
}
