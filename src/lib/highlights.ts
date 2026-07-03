import { LeetCodeUser } from "@/types";

export interface Highlights {
  mostSolved: LeetCodeUser | null;
  topRating: LeetCodeUser | null;
  mostHard: LeetCodeUser | null;
  firstBlood: LeetCodeUser | null;
}

function maxBy(users: LeetCodeUser[], sel: (u: LeetCodeUser) => number): LeetCodeUser | null {
  const valid = users.filter((u) => !u.error);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (sel(b) > sel(a) ? b : a));
}

export function computeHighlights(users: LeetCodeUser[], firstBlood: string): Highlights {
  const valid = users.filter((u) => !u.error);
  const rated = valid.filter((u) => u.contestRating > 0);
  return {
    mostSolved: maxBy(valid, (u) => u.totalSolved),
    topRating: rated.length ? maxBy(rated, (u) => u.contestRating) : null,
    mostHard: maxBy(valid, (u) => u.hardSolved),
    firstBlood: firstBlood
      ? valid.find((u) => u.username.toLowerCase() === firstBlood.toLowerCase()) ?? null
      : null,
  };
}
