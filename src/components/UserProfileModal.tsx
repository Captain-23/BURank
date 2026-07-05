"use client";

import Image from "next/image";
import { useState } from "react";
import { LeetCodeUser } from "@/types";
import { computeBadges, getNextBadgeProgress } from "@/lib/badges";
import BadgeList from "./BadgeList";

interface Props {
  user: LeetCodeUser;
  collegeRank: number;
  onClose: () => void;
}

const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div
    style={{
      background: "var(--bg-2)",
      borderRadius: 6,
      padding: "10px 14px",
    }}
  >
    <p
      style={{
        fontSize: 11,
        color: "var(--sub)",
        margin: "0 0 4px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: 20,
        fontWeight: 600,
        margin: 0,
        fontFamily: "JetBrains Mono, monospace",
        color: color ?? "var(--ink)",
      }}
    >
      {value}
    </p>
  </div>
);

export default function UserProfileModal({
  user,
  collegeRank,
  onClose,
}: Props) {
  const badges = computeBadges(user);
  const nextBadge = getNextBadgeProgress(user);
  const [copied, setCopied] = useState(false);

  const copyGithubMarkdown = async () => {
    if (!user.enrollmentNo) return;

    const markdown = `![My BURank Rank](${window.location.origin}/card/${user.enrollmentNo})`;

    await navigator.clipboard.writeText(markdown);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  const copyRankCard = async () => {
    if (!user.enrollmentNo) {
      console.warn("Enrollment number not available.");

      return;
    }

    const url = `${window.location.origin}/card/${user.enrollmentNo}`;

    await navigator.clipboard.writeText(url);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        {/* Red accent top bar */}
        <div style={{ height: 3, background: "var(--bu-red)" }} />

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={48}
                height={48}
                style={{ borderRadius: "50%", flexShrink: 0 }}
                unoptimized
              />
            ) : (
              <div className="modal-avatar-fallback">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <a
                href={`https://leetcode.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-username-link"
              >
                {user.username}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ opacity: 0.4, flexShrink: 0 }}
                >
                  <path
                    d="M2.5 1.5H10.5V9.5M10.5 1.5L1.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              {user.realName && user.realName !== user.username && (
                <p className="modal-realname">{user.realName}</p>
              )}
            </div>
          </div>

          <div className="modal-header-right">
            <div style={{ textAlign: "right" }}>
              <p className="modal-rank-label">College rank</p>
              <p className="modal-rank-value">#{collegeRank}</p>
            </div>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="modal-section">
          <div className="modal-stats-grid" style={{ marginBottom: 8 }}>
            <Stat label="Total solved" value={user.totalSolved} />
            <Stat label="Global rank" value={`#${user.ranking?.toLocaleString()}`} />
            <Stat label="Contest rating" value={user.contestRating > 0 ? user.contestRating : "—"} />
          </div>
          <div className="modal-stats-grid">
            <Stat label="Easy" value={user.easySolved} color="#00B8A3" />
            <Stat label="Medium" value={user.mediumSolved} color="#FFC01E" />
            <Stat label="Hard" value={user.hardSolved} color="#FF375F" />
          </div>
        </div>

        {nextBadge && (
          <div className="modal-section">
            <p className="modal-section-label">Next Badge</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{nextBadge.label}</span>
              <span style={{ color: "var(--sub)", fontFamily: "JetBrains Mono, monospace" }}>
                {nextBadge.current} / {nextBadge.target}
              </span>
            </div>
            <div style={{ width: "100%", height: 8, background: "var(--track)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${nextBadge.progress}%`,
                  height: "100%",
                  background: "var(--bu-red)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: "var(--sub)" }}>
              {nextBadge.remaining} more {nextBadge.unit} to unlock{" "}
              <strong style={{ color: "var(--ink)" }}>{nextBadge.label}</strong>
            </p>
          </div>
        )}

        {/* Badges */}
        <div className="modal-footer">
          <div style={{ marginBottom: 16 }}>
            <button className="modal-action-btn primary" onClick={copyRankCard}>
              {copied ? "✅ Copied!" : "📋 Copy Rank Card Link"}
            </button>
            <button className="modal-action-btn secondary" onClick={copyGithubMarkdown}>
              📄 Copy GitHub README
            </button>
          </div>
          <p className="modal-section-label" style={{ marginBottom: 12 }}>
            Badges · {badges.length} earned
          </p>
          <BadgeList badges={badges} variant="full" />
        </div>
      </div>
    </div>
  );
}
