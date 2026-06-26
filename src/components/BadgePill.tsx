"use client";

import { useState } from "react";
import { Badge } from "@/lib/badges.ts";

interface Props {
  badge: Badge;
  size?: "sm" | "md";
}

export default function BadgePill({ badge, size = "md" }: Props) {
  const [hovered, setHovered] = useState(false);

  const isSmall = size === "sm";

  return (
    <span
      className={`badge-pill ${badge.colorClass}`}
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
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <i
        className={`ti ${badge.icon}`}
        aria-hidden="true"
        style={{ fontSize: isSmall ? 13 : 14 }}
      />
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
