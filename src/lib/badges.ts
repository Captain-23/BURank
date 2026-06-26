import { LeetCodeUser } from "@/types";

export interface Badge {
  id: string;
  label: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "elite";
}

export const BADGE_DEFINITIONS: Badge[] = [
  { id: "rookie",       label: "Rookie",       description: "Solved 50 problems",           tier: "bronze" },
  { id: "century",      label: "Century",      description: "Solved 100 problems",          tier: "silver" },
  { id: "grinder",      label: "Grinder",      description: "Solved 200 problems",          tier: "gold"   },
  { id: "legend",       label: "Legend",       description: "Solved 500 problems",          tier: "elite"  },
  { id: "brave",        label: "Brave",        description: "Solved 1 hard problem",        tier: "bronze" },
  { id: "savage",       label: "Savage",       description: "Solved 50 hard problems",      tier: "silver" },
  { id: "hard-enjoyer", label: "Hard enjoyer", description: "Solved 100 hard problems",     tier: "gold"   },
  { id: "contestant",   label: "Contestant",   description: "Attended 1 contest",           tier: "bronze" },
  { id: "rated",        label: "Rated",        description: "Contest rating 1500+",         tier: "silver" },
  { id: "expert",       label: "Expert",       description: "Contest rating 1800+",         tier: "gold"   },
  { id: "master",       label: "Master",       description: "Contest rating 2100+",         tier: "elite"  },
  { id: "balanced",     label: "Balanced",     description: "Solved 100 medium problems",   tier: "silver" },
];

export function computeBadges(user: LeetCodeUser): Badge[] {
  const earned: Badge[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition) {
      const def = BADGE_DEFINITIONS.find((b) => b.id === id);
      if (def) earned.push(def);
    }
  };

  check("rookie",       user.totalSolved >= 50);
  check("century",      user.totalSolved >= 100);
  check("grinder",      user.totalSolved >= 200);
  check("legend",       user.totalSolved >= 500);
  check("brave",        user.hardSolved >= 1);
  check("savage",       user.hardSolved >= 50);
  check("hard-enjoyer", user.hardSolved >= 100);
  check("contestant",   user.attendedContestsCount >= 1);
  check("rated",        user.contestRating >= 1500);
  check("expert",       user.contestRating >= 1800);
  check("master",       user.contestRating >= 2100);
  check("balanced",     user.mediumSolved >= 100);

  return earned;
}

export const TIER_STYLE: Record<
  Badge["tier"],
  { bg: string; text: string; border: string; dot: string }
> = {
  bronze: { bg: "rgba(205,127,50,0.12)",  text: "#cd7f32", border: "rgba(205,127,50,0.3)",  dot: "#cd7f32" },
  silver: { bg: "rgba(192,192,192,0.10)", text: "#b0b0b0", border: "rgba(192,192,192,0.28)", dot: "#c0c0c0" },
  gold:   { bg: "rgba(255,193,7,0.12)",   text: "#ffc107", border: "rgba(255,193,7,0.3)",   dot: "#ffc107" },
  elite:  { bg: "rgba(168,85,247,0.12)",  text: "#c084fc", border: "rgba(168,85,247,0.3)",  dot: "#c084fc" },
};
