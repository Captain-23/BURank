import { describe, it, expect } from "vitest";
import { computeStaleUsernames } from "./ingest-reconcile";

describe("computeStaleUsernames", () => {
  it("returns usernames present in existing but not incoming", () => {
    expect(computeStaleUsernames(["a", "b", "c"], ["a", "c"])).toEqual(["b"]);
  });

  it("is case-insensitive", () => {
    expect(computeStaleUsernames(["Bob"], ["bob"])).toEqual([]);
  });

  it("returns empty when everything is still present", () => {
    expect(computeStaleUsernames(["a"], ["a", "b"])).toEqual([]);
  });
});
