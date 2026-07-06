import { describe, it, expect } from "vitest";
import { computeFirstBlood } from "./first-blood";

const QOTW_URL = "https://leetcode.com/problems/two-sum/";
const QOTW_TS = "2026-01-01T00:00:00.000Z"; // => unix 1767225600

describe("computeFirstBlood", () => {
  it("returns the earliest solver at/after the qotw timestamp", () => {
    const users = [
      { username: "late", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767230000" }] },
      { username: "early", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767225601" }] },
    ];
    expect(computeFirstBlood(users, QOTW_URL, QOTW_TS)).toBe("early");
  });

  it("ignores submissions before the qotw timestamp", () => {
    const users = [
      { username: "before", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767220000" }] },
    ];
    expect(computeFirstBlood(users, QOTW_URL, QOTW_TS)).toBeNull();
  });

  it("ignores submissions for other problems", () => {
    const users = [
      { username: "other", recentSubmissions: [{ titleSlug: "add-two-numbers", timestamp: "1767230000" }] },
    ];
    expect(computeFirstBlood(users, QOTW_URL, QOTW_TS)).toBeNull();
  });

  it("returns null when url or timestamp is missing", () => {
    const users = [{ username: "x", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767230000" }] }];
    expect(computeFirstBlood(users, "", QOTW_TS)).toBeNull();
    expect(computeFirstBlood(users, QOTW_URL, "")).toBeNull();
  });
});
