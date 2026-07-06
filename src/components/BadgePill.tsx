"use client";

import { BADGE_ICONS } from "@/lib/badge-icons";
import { useState } from "react";
import { Badge, TIER_STYLE } from "@/lib/badges";

interface Props {
  badge: Badge;
  size?: "sm" | "md";
}

export default function BadgePill({ badge, size = "md" }: Props) {
  const [hovered, setHovered] = useState(false);

  const isSmall = size === "sm";
  const style = TIER_STYLE[badge.tier];
  const Icon = BADGE_ICONS[badge.id as keyof typeof BADGE_ICONS];
  

  return (
    <span
      className="badge-pill"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        padding: isSmall ? "3px 8px 3px 6px" : "5px 10px 5px 8px",
        borderRadius: 6,
        fontSize: isSmall ? 11 : 12,
        fontWeight: 500,
        border: "0.5px solid",
        position: "relative",
        cursor: "default",
        userSelect: "none",
        whiteSpace: "nowrap",
        background: style.bg,

        color: style.text,

        borderColor: style.border,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {Icon ? (
        <Icon size={isSmall ? 12 : 15} color={style.dot} aria-hidden />
      ) : (
        <span
          style={{
            width: isSmall ? 6 : 8,
            height: isSmall ? 6 : 8,
            borderRadius: "50%",
            background: style.dot,
            flexShrink: 0,
          }}
        />
      )}
      {badge.label}

      {/* Tooltip */}
      {hovered && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a2a",
            border: "0.5px solid #2a2a3e",
            color: "#e2e2f0",
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {badge.description}
        </span>
      )}
    </span>
  );
}
