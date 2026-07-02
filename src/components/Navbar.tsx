"use client";

// src/components/Navbar.tsx
// Add this to the top of your leaderboard page.
// Shows: BUrank wordmark | signed-in email | sign out button

import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const email             = session?.user?.email ?? "";
  const enrollment        = email.split("@")[0]?.toUpperCase() ?? "";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 0 20px",
      borderBottom: "1px solid #1E1E2E",
      marginBottom: 24,
    }}>
      {/* Left: wordmark */}
      <p style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#E2E2F0",
        margin: 0,
      }}>
        BU<span style={{ color: "#C8102E" }}>rge</span>
      </p>

      {/* Right: user info + sign out */}
      {session && (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#E2E2F0",
              margin: 0,
            }}>
              {enrollment}
            </p>
            <p style={{ fontSize: 10, color: "#555570", margin: "1px 0 0" }}>
              {email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #1E1E2E",
              background: "none",
              color: "#8888A8",
              fontSize: 12,
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E2E2F0";
              e.currentTarget.style.borderColor = "#2A2A3E";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#8888A8";
              e.currentTarget.style.borderColor = "#1E1E2E";
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
