import { describe, it, expect } from "vitest";
import { computeHighlights } from "@/lib/highlights";
import type { LeetCodeUser } from "@/types";

const mk = (over: Partial<LeetCodeUser>): LeetCodeUser => ({
  username: "u", realName: "U", avatar: "", ranking: 1,
  totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
  acceptanceRate: 0, contestRating: 0, contestGlobalRanking: 0,
  attendedContestsCount: 0, topPercentage: 100, ...over,
});

describe("computeHighlights", () => {
  const users = [
    mk({ username: "a", realName: "Aa", totalSolved: 842, hardSolved: 60, contestRating: 1800 }),
    mk({ username: "b", realName: "Bb", totalSolved: 700, hardSolved: 118, contestRating: 2210 }),
  ];
  it("finds most solved, top rating, most hard", () => {
    const h = computeHighlights(users, "");
    expect(h.mostSolved?.username).toBe("a");
    expect(h.topRating?.username).toBe("b");
    expect(h.mostHard?.username).toBe("b");
  });
  it("resolves first blood from username", () => {
    const h = computeHighlights(users, "a");
    expect(h.firstBlood?.username).toBe("a");
  });
  it("returns null slots for an empty list", () => {
    const h = computeHighlights([], "");
    expect(h.mostSolved).toBeNull();
    expect(h.firstBlood).toBeNull();
  });
  it("ignores errored users", () => {
    const withError = [...users, mk({ username: "c", totalSolved: 9999, error: true })];
    const h = computeHighlights(withError, "");
    expect(h.mostSolved?.username).toBe("a");
  });
});
