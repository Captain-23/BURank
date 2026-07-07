"use client";

import { useState } from "react";
import { BadgeIcon } from "@/lib/badge-icons";
import { Badge, TIER_STYLE } from "@/lib/badges";

interface Props {
  badges: Badge[];
  // compact = small inline pills (for leaderboard rows)
  // full    = larger cards with description (for profile modal)
  variant?: "compact" | "full";
}

export default function BadgeList({ badges, variant = "compact" }: Props) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (badges.length === 0) {
    return <span className="badge-list-empty">No badges yet</span>;
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
              <BadgeIcon id={badge.id} size={11} color={s.dot} />
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
    <div className="badge-list-full">
      {tierOrder.map((tier) => {
        const group = grouped[tier];
        if (!group || group.length === 0) return null;
        const s = TIER_STYLE[tier];

        return (
          <div key={tier}>
            <p className="badge-tier-label" style={{ color: s.text }}>
              {tier}
            </p>
            <div className="badge-tier-grid">
              {group.map((badge) => (
                <div
                  key={badge.id}
                  className="badge-card"
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <div className="badge-card-head">
                    <BadgeIcon id={badge.id} size={14} color={s.dot} />
                    <span className="badge-card-label" style={{ color: s.text }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="badge-card-desc">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
