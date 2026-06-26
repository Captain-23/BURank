import { LeetCodeUser } from "@/types";

export interface Badge {
  id: string;
  label: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "elite";
}

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: "rookie",
    label: "Rookie",
    description: "Solved 50 problems",
    tier: "bronze",
  },
  {
    id: "century",
    label: "Century",
    description: "Solved 100 problems",
    tier: "silver",
  },
  {
    id: "grinder",
    label: "Grinder",
    description: "Solved 200 problems",
    tier: "gold",
  },
  {
    id: "legend",
    label: "Legend",
    description: "Solved 500 problems",
    tier: "elite",
  },
  {
    id: "brave",
    label: "Brave",
    description: "Solved 1 hard problem",
    tier: "bronze",
  },
  {
    id: "savage",
    label: "Savage",
    description: "Solved 50 hard problems",
    tier: "silver",
  },
  {
    id: "hard-enjoyer",
    label: "Hard enjoyer",
    description: "Solved 100 hard problems",
    tier: "gold",
  },
  {
    id: "contestant",
    label: "Contestant",
    description: "Attended 1 contest",
    tier: "bronze",
  },
  {
    id: "rated",
    label: "Rated",
    description: "Contest rating 1500+",
    tier: "silver",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Contest rating 1800+",
    tier: "gold",
  },
  {
    id: "master",
    label: "Master",
    description: "Contest rating 2100+",
    tier: "elite",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Solved 100 medium problems",
    tier: "silver",
  },
];

export function computeBadges(user: LeetCodeUser): Badge[] {
  const earned: Badge[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition) {
      const def = BADGE_DEFINITIONS.find((b) => b.id === id);
      if (def) earned.push(def);
    }
  };

  check("rookie", user.totalSolved >= 50);
  check("century", user.totalSolved >= 100);
  check("grinder", user.totalSolved >= 200);
  check("legend", user.totalSolved >= 500);
  check("brave", user.hardSolved >= 1);
  check("savage", user.hardSolved >= 50);
  check("hard-enjoyer", user.hardSolved >= 100);
  check("contestant", user.attendedContestsCount >= 1);
  check("rated", user.contestRating >= 1500);
  check("expert", user.contestRating >= 1800);
  check("master", user.contestRating >= 2100);
  check("balanced", user.mediumSolved >= 100);

  return earned;
}

export const TIER_STYLE: Record<
  Badge["tier"],
  { bg: string; text: string; border: string; dot: string }
> = {
  bronze: {
    bg: "rgba(205,127,50,0.12)",
    text: "#cd7f32",
    border: "rgba(205,127,50,0.3)",
    dot: "#cd7f32",
  },
  silver: {
    bg: "rgba(192,192,192,0.10)",
    text: "#b0b0b0",
    border: "rgba(192,192,192,0.28)",
    dot: "#c0c0c0",
  },
  gold: {
    bg: "rgba(255,193,7,0.12)",
    text: "#ffc107",
    border: "rgba(255,193,7,0.3)",
    dot: "#ffc107",
  },
  elite: {
    bg: "rgba(168,85,247,0.12)",
    text: "#c084fc",
    border: "rgba(168,85,247,0.3)",
    dot: "#c084fc",
  },
};

export interface NextBadgeProgress {
  id: string;
  label: string;
  current: number;
  target: number;
  remaining: number;
  progress: number;
  unit: string;
}

export function getNextBadgeProgress(
  user: LeetCodeUser,
): NextBadgeProgress | null {
  const milestones = [
    {
      id: "rookie",
      label: "Rookie",
      current: user.totalSolved,
      target: 50,
      unit: "solved problems",
    },
    {
      id: "century",
      label: "Century",
      current: user.totalSolved,
      target: 100,
      unit: "solved problems",
    },
    {
      id: "grinder",
      label: "Grinder",
      current: user.totalSolved,
      target: 200,
      unit: "solved problems",
    },
    {
      id: "legend",
      label: "Legend",
      current: user.totalSolved,
      target: 500,
      unit: "solved problems",
    },

    {
      id: "brave",
      label: "Brave",
      current: user.hardSolved,
      target: 1,
      unit: "hard problems",
    },
    {
      id: "savage",
      label: "Savage",
      current: user.hardSolved,
      target: 50,
      unit: "hard problems",
    },
    {
      id: "hard-enjoyer",
      label: "Hard Enjoyer",
      current: user.hardSolved,
      target: 100,
      unit: "hard problems",
    },

    {
      id: "contestant",
      label: "Contestant",
      current: user.attendedContestsCount,
      target: 1,
      unit: "contests",
    },

    {
      id: "rated",
      label: "Rated",
      current: user.contestRating,
      target: 1500,
      unit: "rating",
    },
    {
      id: "expert",
      label: "Expert",
      current: user.contestRating,
      target: 1800,
      unit: "rating",
    },
    {
      id: "master",
      label: "Master",
      current: user.contestRating,
      target: 2100,
      unit: "rating",
    },

    {
      id: "balanced",
      label: "Balanced",
      current: user.mediumSolved,
      target: 100,
      unit: "medium problems",
    },
  ];

  const remaining = milestones
    .filter((m) => m.current < m.target)
    .map((m) => ({
      ...m,
      remaining: m.target - m.current,
      progress: Math.min(100, (m.current / m.target) * 100),
    }));

  if (!remaining.length) return null;

  remaining.sort((a, b) => a.remaining - b.remaining);

  return remaining[0];
}
