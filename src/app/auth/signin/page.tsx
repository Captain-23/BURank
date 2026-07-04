"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";


export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const callbackUrl = "/";

  // Validate format client-side before sending
  const isValidEmail = () => true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    

    setStatus("loading");
    setMessage("");

    // signIn("email") triggers NextAuth's EmailProvider
    // which calls our sendVerificationRequest → Resend
    const res = await signIn("email", {
      email: trimmed,
      redirect: false, // handle redirect ourselves
      callbackUrl,
    });

    if (res?.error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return;
    }

    // Success — NextAuth will redirect to /auth/verify
    setStatus("sent");
  };

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
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            BU<span style={{ color: "var(--bu-red)" }}>Rank</span>
          </p>
          <p style={{ fontSize: 13, color: "var(--sub)", margin: "6px 0 0" }}>
            Bennett University · LeetCode Leaderboard
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Red top bar */}
          <div style={{ height: 3, background: "var(--bu-red)" }} />

          <div style={{ padding: "28px 28px 32px" }}>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 6px",
              }}
            >
              Sign in
            </h1>
            <p style={{ fontSize: 13, color: "var(--sub)", margin: "0 0 24px" }}>
              Enter your Personal email to receive a sign-in link. No password
              needed.
            </p>

            {status === "sent" ? (
              /* ── Success state ── */
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(0,184,163,0.15)",
                    border: "1px solid rgba(0,184,163,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: 22,
                  }}
                >
                  ✓
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#00B8A3",
                    margin: "0 0 8px",
                  }}
                >
                  Check your inbox
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--sub)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  We sent a sign-in link to
                  <br />
                  <strong style={{ color: "var(--ink)", fontFamily: "monospace" }}>
                    {email.trim().toLowerCase()}
                  </strong>
                  <br />
                  Open your Bennett Outlook and click the link.
                </p>
                <p
                  style={{ fontSize: 11, color: "var(--muted)", margin: "16px 0 0" }}
                >
                  Link expires in 15 minutes · one-time use only
                </p>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={handleSubmit}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--sub)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  Bennett Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                    setMessage("");
                  }}
                  placeholder="example@gmail.com"
                  disabled={status === "loading"}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: `1px solid ${status === "error" ? "var(--hard)" : "var(--line)"}`,
                    background: "var(--bg-2)",
                    color: "var(--ink)",
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    if (status !== "error") {
                      e.target.style.borderColor = "var(--bu-red)";
                    }
                  }}
                  onBlur={(e) => {
                    if (status !== "error") {
                      e.target.style.borderColor = "var(--line)";
                    }
                  }}
                />

                {/* Error message */}
                {status === "error" && message && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--hard)",
                      margin: "6px 0 0",
                    }}
                  >
                    {message}
                  </p>
                )}

                {/* Hint */}
                {status !== "error" && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      margin: "6px 0 0",
                    }}
                  >
                    Do not use @bennett.edu.in
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || status === "loading"}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: "11px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--bu-red)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: !email.trim() || status === "loading" ? 0.4 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {status === "loading" ? "Sending…" : "Send sign-in link"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--muted)",
            marginTop: 20,
          }}
        >
          Only Bennett University students can sign in.
        </p>
      </div>
    </div>
  );
}
