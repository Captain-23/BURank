"use client";

import Image from "next/image";
import { LeetCodeUser } from "@/types";
import { computeBadges } from "@/lib/badges.ts";
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
      background: "#0A0A0F",
      borderRadius: 6,
      padding: "10px 14px",
    }}
  >
    <p style={{ fontSize: 11, color: "#8888a8", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </p>
    <p style={{ fontSize: 20, fontWeight: 600, margin: 0, fontFamily: "JetBrains Mono, monospace", color: color ?? "#E2E2F0" }}>
      {value}
    </p>
  </div>
);

export default function UserProfileModal({ user, collegeRank, onClose }: Props) {
  const badges = computeBadges(user);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#111118",
          border: "1px solid #1E1E2E",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Red accent top bar */}
        <div style={{ height: 3, background: "#C8102E" }} />

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1E1E2E" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={48}
                  height={48}
                  style={{ borderRadius: "50%" }}
                  unoptimized
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#C8102E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <a
                  href={`https://leetcode.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#E2E2F0",
                    textDecoration: "none",
                    fontFamily: "JetBrains Mono, monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {user.username}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4 }}>
                    <path d="M2.5 1.5H10.5V9.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </a>
                {user.realName && user.realName !== user.username && (
                  <p style={{ fontSize: 13, color: "#8888a8", margin: "2px 0 0" }}>
                    {user.realName}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#8888a8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  College rank
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "JetBrains Mono, monospace", color: "#C8102E" }}>
                  #{collegeRank}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8888a8",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #1E1E2E" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
            <Stat label="Total solved"  value={user.totalSolved} />
            <Stat label="Global rank"   value={`#${user.ranking?.toLocaleString()}`} />
            <Stat label="Contest rating" value={user.contestRating > 0 ? user.contestRating : "—"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <Stat label="Easy"   value={user.easySolved}   color="#00B8A3" />
            <Stat label="Medium" value={user.mediumSolved} color="#FFC01E" />
            <Stat label="Hard"   value={user.hardSolved}   color="#FF375F" />
          </div>
        </div>

        {/* Badges */}
        <div style={{ padding: "16px 24px 24px" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8888a8",
              margin: "0 0 12px",
            }}
          >
            Badges · {badges.length} earned
          </p>
          <BadgeList badges={badges} variant="full" />
        </div>
      </div>
    </div>
  );
}
