import { LeetCodeUser } from "@/types";
import { computeBadges, Badge } from "@/lib/badges";

export interface BestBadge { label: string; icon: string; tone: "gold" | "default"; }

const TIER_RANK: Record<Badge["tier"], number> = { elite: 4, gold: 3, silver: 2, bronze: 1 };
const ICONS: Record<string, string> = {
  legend: "🏆", grinder: "⚙️", century: "💯", rookie: "🌱",
  "hard-enjoyer": "🔥", savage: "⚔️", brave: "🗡️",
  master: "👑", expert: "🎯", rated: "📈", contestant: "🎮", balanced: "⚖️",
};

export function getBestBadge(user: LeetCodeUser): BestBadge | null {
  const earned = computeBadges(user);
  if (earned.length === 0) return null;
  const best = earned.reduce((a, b) => (TIER_RANK[b.tier] > TIER_RANK[a.tier] ? b : a));
  return {
    label: best.label,
    icon: ICONS[best.id] ?? "🏅",
    tone: best.tier === "gold" || best.tier === "elite" ? "gold" : "default",
  };
}
