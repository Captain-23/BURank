import { describe, it, expect } from "vitest";
import {
  enrollmentMatches,
  isPlausibleEnrollmentNo,
  normalizeEnrollmentNo,
  resolveEnrollmentNo,
} from "./enrollment";

describe("normalizeEnrollmentNo", () => {
  it("trims, uppercases, and removes internal whitespace", () => {
    expect(normalizeEnrollmentNo("  a230521026 ")).toBe("A230521026");
    expect(normalizeEnrollmentNo("a23 052 1026")).toBe("A230521026");
  });
});

describe("isPlausibleEnrollmentNo", () => {
  it("accepts Bennett-style enrollment numbers", () => {
    expect(isPlausibleEnrollmentNo("A230521026")).toBe(true);
    expect(isPlausibleEnrollmentNo("E21CSE001")).toBe(true);
  });

  it("rejects dates and short values", () => {
    expect(isPlausibleEnrollmentNo("2024-01-01")).toBe(false);
    expect(isPlausibleEnrollmentNo("abc")).toBe(false);
    expect(isPlausibleEnrollmentNo("secret123")).toBe(false);
  });
});

describe("enrollmentMatches", () => {
  it("matches values that differ only by case or spacing", () => {
    expect(enrollmentMatches("a230521026", "A230521026")).toBe(true);
    expect(enrollmentMatches("A23 0521026", "a230521026")).toBe(true);
    expect(enrollmentMatches("A230521026", "A230521027")).toBe(false);
  });
});

describe("resolveEnrollmentNo", () => {
  it("returns the first plausible enrollment from sources", () => {
    expect(resolveEnrollmentNo(["", "2024-01-01", "A230521026"])).toBe(
      "A230521026",
    );
    expect(resolveEnrollmentNo(["A230521026", "E21CSE001"])).toBe("A230521026");
  });
});
