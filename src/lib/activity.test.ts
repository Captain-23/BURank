import { describe, expect, it } from "vitest";
import {
  buildActivityPayload,
  collectRecentSlugs,
  formatActivityWhen,
  parseSubmissionTime,
  titleFromSlug,
} from "./activity";

describe("titleFromSlug", () => {
  it("turns a slug into a readable title", () => {
    expect(titleFromSlug("two-sum")).toBe("Two Sum");
  });
});

describe("parseSubmissionTime", () => {
  it("parses unix seconds", () => {
    expect(parseSubmissionTime("1767225600")?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("rejects invalid values", () => {
    expect(parseSubmissionTime("")).toBeNull();
    expect(parseSubmissionTime("nope")).toBeNull();
  });
});

function unixSeconds(iso: string): string {
  return String(Math.floor(new Date(iso).getTime() / 1000));
}

const CUTOFF = new Date("2026-08-26T00:00:00.000Z");

const SAMPLE_USERS = [
  {
    username: "neal",
    realName: "Neal Wu",
    avatar: "https://img",
    recentSubmissions: [
      { titleSlug: "old-problem", timestamp: unixSeconds("2026-08-25T12:00:00.000Z") },
      { title: "Two Sum", titleSlug: "two-sum", timestamp: unixSeconds("2026-08-26T12:00:00.000Z") },
    ],
  },
];

describe("collectRecentSlugs", () => {
  it("returns only slugs solved at or after the cutoff", () => {
    expect(collectRecentSlugs(SAMPLE_USERS, CUTOFF)).toEqual(["two-sum"]);
  });
});

describe("buildActivityPayload", () => {
  it("maps recent solves onto problem metadata", () => {
    const events = buildActivityPayload(
      SAMPLE_USERS,
      {
        "two-sum": {
          titleSlug: "two-sum",
          title: "Two Sum",
          frontendId: "1",
          difficulty: "Easy",
        },
      },
      CUTOFF,
    );

    expect(events).toEqual([
      expect.objectContaining({
        username: "neal",
        title: "Two Sum",
        frontendId: "1",
        difficulty: "Easy",
      }),
    ]);
  });

  it("skips fetchError users", () => {
    const events = buildActivityPayload(
      [
        {
          username: "ghost",
          fetchError: true,
          recentSubmissions: [
            { titleSlug: "two-sum", timestamp: unixSeconds("2026-08-26T12:00:00.000Z") },
          ],
        },
      ],
      {},
      CUTOFF,
    );
    expect(events).toEqual([]);
  });
});

describe("formatActivityWhen", () => {
  const now = new Date("2026-08-26T15:00:00.000Z");

  it("uses relative labels", () => {
    expect(formatActivityWhen(new Date("2026-08-26T14:59:30.000Z"), now)).toBe(
      "just now",
    );
    expect(formatActivityWhen(new Date("2026-08-26T14:40:00.000Z"), now)).toBe(
      "20m ago",
    );
    expect(formatActivityWhen(new Date("2026-08-26T10:00:00.000Z"), now)).toBe(
      "today",
    );
    expect(formatActivityWhen(new Date("2026-08-25T10:00:00.000Z"), now)).toBe(
      "yesterday",
    );
  });
});
