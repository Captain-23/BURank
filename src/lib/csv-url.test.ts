import { describe, expect, it } from "vitest";
import { withCacheBust } from "./csv-url";

describe("withCacheBust", () => {
  it("appends cachebust using ? when no query string exists", () => {
    expect(withCacheBust("https://example.com/sheet.csv", 123)).toBe(
      "https://example.com/sheet.csv?cachebust=123",
    );
  });

  it("appends cachebust using & when query string exists", () => {
    expect(
      withCacheBust("https://example.com/sheet.csv?gid=0&single=true", 456),
    ).toBe("https://example.com/sheet.csv?gid=0&single=true&cachebust=456");
  });
});
