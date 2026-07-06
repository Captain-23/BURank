import { describe, it, expect } from "vitest";
import { getBestBadge } from "@/lib/best-badge";
import type { LeetCodeUser } from "@/types";

const base: LeetCodeUser = {
  username: "u", realName: "U", avatar: "", ranking: 1,
  totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
  acceptanceRate: 0, contestRating: 0, contestGlobalRanking: 0,
  attendedContestsCount: 0, topPercentage: 100,
};

describe("getBestBadge", () => {
  it("returns null when no badge is earned", () => {
    expect(getBestBadge(base)).toBeNull();
  });
  it("picks the highest-tier earned badge", () => {
    const u = { ...base, totalSolved: 600, hardSolved: 60 };
    const b = getBestBadge(u);
    expect(b?.label).toBe("Legend");
    expect(b?.tone).toBe("gold");
  });
  it("falls back to a lower tier when no elite/gold earned", () => {
    const u = { ...base, totalSolved: 60 };
    const b = getBestBadge(u);
    expect(b?.label).toBe("Rookie");
    expect(b?.tone).toBe("default");
  });
  it("provides a badge id for the icon", () => {
    const u = { ...base, totalSolved: 250 };
    expect(typeof getBestBadge(u)?.id).toBe("string");
    expect(getBestBadge(u)?.id).toBe("grinder");
  });
});
