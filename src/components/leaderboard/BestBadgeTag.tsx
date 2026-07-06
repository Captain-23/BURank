import { BadgeIcon } from "@/lib/badge-icons";
import { getBestBadge } from "@/lib/best-badge";
import { LeetCodeUser } from "@/types";

export default function BestBadgeTag({ user }: { user: LeetCodeUser }) {
  const badge = getBestBadge(user);
  if (!badge) return <span className="best-tag">—</span>;
  return (
    <span className={`best-tag${badge.tone === "gold" ? " gold" : ""}`}>
      <span className="ic">
        <BadgeIcon id={badge.id} size={12} />
      </span>{" "}
      {badge.label}
    </span>
  );
}
