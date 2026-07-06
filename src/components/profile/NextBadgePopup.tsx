"use client";

import { useEffect, useState } from "react";
import { BadgeIcon } from "@/lib/badge-icons";
import { BADGE_DEFINITIONS, NextBadgeProgress, TIER_STYLE } from "@/lib/badges";

interface Props {
  username: string;
  nextBadge: NextBadgeProgress;
}

export default function NextBadgePopup({ username, nextBadge }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `next-badge-dismissed-${username}`;
    if (sessionStorage.getItem(key)) return;
    setOpen(true);
  }, [username]);

  const dismiss = () => {
    sessionStorage.setItem(`next-badge-dismissed-${username}`, "1");
    setOpen(false);
  };

  if (!open) return null;

  const def = BADGE_DEFINITIONS.find((b) => b.id === nextBadge.id);
  const tierStyle = def ? TIER_STYLE[def.tier] : TIER_STYLE.bronze;

  return (
    <div className="next-badge-overlay" onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <div className="next-badge-card" role="dialog" aria-labelledby="next-badge-title">
        <button className="next-badge-close" onClick={dismiss} aria-label="Dismiss">
          ×
        </button>

        <div className="next-badge-header">
          <div
            className="next-badge-icon-wrap"
            style={{ background: tierStyle.bg, borderColor: tierStyle.border }}
          >
            <BadgeIcon id={nextBadge.id} size={22} color={tierStyle.text} />
          </div>
          <div>
            <p className="next-badge-eyebrow">Next achievable badge</p>
            <h2 id="next-badge-title" className="next-badge-title" style={{ color: tierStyle.text }}>
              {nextBadge.label}
            </h2>
            {def && <p className="next-badge-desc">{def.description}</p>}
          </div>
        </div>

        <div className="next-badge-progress-row">
          <span className="next-badge-progress-label">Progress</span>
          <span className="next-badge-progress-value">
            {nextBadge.current.toLocaleString()} / {nextBadge.target.toLocaleString()}
          </span>
        </div>

        <div className="next-badge-track">
          <div
            className="next-badge-fill"
            style={{ width: `${nextBadge.progress}%`, background: tierStyle.text }}
          />
        </div>

        <p className="next-badge-remaining">
          <strong>{nextBadge.remaining.toLocaleString()}</strong> more {nextBadge.unit} to unlock{" "}
          <strong>{nextBadge.label}</strong>
        </p>

        <button className="next-badge-dismiss-btn" onClick={dismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
