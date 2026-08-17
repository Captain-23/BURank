import { describe, it, expect } from "vitest";
import {
  enrollmentMatches,
  normalizeEnrollmentNo,
} from "./enrollment";

describe("normalizeEnrollmentNo", () => {
  it("trims, uppercases, and removes internal whitespace", () => {
    expect(normalizeEnrollmentNo("  a230521026 ")).toBe("A230521026");
    expect(normalizeEnrollmentNo("a23 052 1026")).toBe("A230521026");
  });
});

describe("enrollmentMatches", () => {
  it("matches values that differ only by case or spacing", () => {
    expect(enrollmentMatches("a230521026", "A230521026")).toBe(true);
    expect(enrollmentMatches("A23 0521026", "a230521026")).toBe(true);
    expect(enrollmentMatches("A230521026", "A230521027")).toBe(false);
  });
});
