"use client";

import { Badge } from "@/lib/badges";
import BadgeList from "@/components/BadgeList";

interface Props {
  badges: Badge[];
}

export default function ProfileBadges({ badges }: Props) {
  return (
    <div className="card profile-badges">
      <div className="profile-badges-head">
        <h2>Badges</h2>
        <span className="profile-badges-count">{badges.length} earned</span>
      </div>
      <BadgeList badges={badges} variant="full" />
    </div>
  );
}
