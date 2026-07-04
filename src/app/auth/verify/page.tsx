// src/app/auth/verify/page.tsx
// NextAuth redirects here after sending the magic link.
// Simple static page — just tells the user to check their email.

export default function VerifyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bu-dark)",
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
            color: "var(--ink)",
            margin: "0 0 32px",
          }}
        >
          BU<span style={{ color: "var(--bu-red)" }}>rge</span>
        </p>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(0,184,163,0.12)",
            border: "1px solid rgba(0,184,163,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 26,
            color: "#00B8A3",
          }}
        >
          ✉
        </div>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--ink)",
            margin: "0 0 10px",
          }}
        >
          Check your Bennett inbox
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--sub)",
            margin: "0 0 6px",
            lineHeight: 1.7,
          }}
        >
          A sign-in link has been sent to your
          <br />
          <strong style={{ color: "var(--ink)" }}>@bennett.edu.in</strong> email
          address.
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--sub)",
            margin: "0 0 24px",
            lineHeight: 1.7,
          }}
        >
          Open your Outlook inbox and click the link
          <br />
          to complete sign-in.
        </p>

        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "12px 16px",
            fontSize: 12,
            color: "var(--muted)",
            lineHeight: 1.7,
            textAlign: "left",
          }}
        >
          <strong style={{ color: "var(--sub)" }}>Didn't receive it?</strong>
          <br />
          · Check your Junk / Spam folder
          <br />
          · The link expires in 15 minutes
          <br />· Go back and try again if needed
        </div>

        <a
          href="/auth/signin"
          style={{
            display: "inline-block",
            marginTop: 20,
            fontSize: 13,
            color: "var(--sub)",
            textDecoration: "none",
            borderBottom: "1px solid var(--muted)",
            paddingBottom: 1,
          }}
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  );
}
