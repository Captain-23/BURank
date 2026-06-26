"use client";

import { useState } from "react";
import { Badge, TIER_STYLE } from "@/lib/badges.ts";

interface Props {
  badges: Badge[];
  // compact = small inline pills (for leaderboard rows)
  // full    = larger cards with description (for profile modal)
  variant?: "compact" | "full";
}

export default function BadgeList({ badges, variant = "compact" }: Props) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (badges.length === 0) {
    return (
      <span style={{ fontSize: 12, color: "var(--bu-sub, #8888a8)" }}>
        No badges yet
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, position: "relative" }}>
        {badges.map((badge) => {
          const s = TIER_STYLE[badge.tier];
          return (
            <span
              key={badge.id}
              onMouseEnter={() => setTooltip(badge.id)}
              onMouseLeave={() => setTooltip(null)}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.02em",
                cursor: "default",
                background: s.bg,
                color: s.text,
                border: `1px solid ${s.border}`,
                userSelect: "none",
                transition: "opacity 0.15s",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: s.dot,
                  flexShrink: 0,
                }}
              />
              {badge.label}

              {tooltip === badge.id && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1E1E2E",
                    border: "1px solid #2A2A3E",
                    color: "#E2E2F0",
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    zIndex: 50,
                    pointerEvents: "none",
                  }}
                >
                  {badge.description}
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  // full variant — cards with description, used in profile modal
  const tierOrder: Badge["tier"][] = ["elite", "gold", "silver", "bronze"];
  const grouped = tierOrder.reduce<Record<string, Badge[]>>((acc, tier) => {
    acc[tier] = badges.filter((b) => b.tier === tier);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {tierOrder.map((tier) => {
        const group = grouped[tier];
        if (!group || group.length === 0) return null;
        const s = TIER_STYLE[tier];

        return (
          <div key={tier}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: s.text,
                marginBottom: 8,
              }}
            >
              {tier}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 8,
              }}
            >
              {group.map((badge) => (
                <div
                  key={badge.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: s.dot,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: s.text,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#8888a8",
                      margin: 0,
                      paddingLeft: 12,
                    }}
                  >
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
