export interface RawSubmission {
  title?: string;
  titleSlug: string;
  timestamp: string | number;
}

export interface ProblemMeta {
  titleSlug: string;
  title: string;
  frontendId: string;
  difficulty: string;
}

export interface ActivityPayload {
  username: string;
  realName: string;
  avatar: string;
  title: string;
  titleSlug: string;
  frontendId: string;
  difficulty: string;
  solvedAt: string;
}

export const ACTIVITY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const FEED_WINDOW_MS = 48 * 60 * 60 * 1000;

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseSubmissionTime(
  timestamp: string | number,
): Date | null {
  const n = typeof timestamp === "number" ? timestamp : Number(timestamp);
  if (!Number.isFinite(n) || n <= 0) return null;
  const ms = n > 1e12 ? n : n * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function collectRecentSlugs(
  users: { recentSubmissions?: RawSubmission[] }[],
  since: Date,
): string[] {
  const slugs = new Set<string>();
  for (const user of users) {
    for (const submission of user.recentSubmissions ?? []) {
      const solvedAt = parseSubmissionTime(submission.timestamp);
      if (!solvedAt || solvedAt < since) continue;
      const slug = submission.titleSlug?.trim();
      if (slug) slugs.add(slug);
    }
  }
  return [...slugs];
}

export function buildActivityPayload(
  users: {
    username: string;
    realName?: string;
    avatar?: string;
    fetchError?: boolean;
    recentSubmissions?: RawSubmission[];
  }[],
  problems: Record<string, ProblemMeta>,
  since: Date,
): ActivityPayload[] {
  const events: ActivityPayload[] = [];
  for (const user of users) {
    if (user.fetchError) continue;
    const username = user.username.trim().toLowerCase();
    if (!username) continue;
    for (const submission of user.recentSubmissions ?? []) {
      const solvedAt = parseSubmissionTime(submission.timestamp);
      if (!solvedAt || solvedAt < since) continue;
      const slug = submission.titleSlug?.trim();
      if (!slug) continue;
      const meta = problems[slug];
      events.push({
        username,
        realName: (user.realName || user.username).trim() || username,
        avatar: user.avatar?.trim() || "",
        title: meta?.title || submission.title?.trim() || titleFromSlug(slug),
        titleSlug: slug,
        frontendId: meta?.frontendId || "",
        difficulty: meta?.difficulty || "Unknown",
        solvedAt: solvedAt.toISOString(),
      });
    }
  }
  return events;
}

export function formatActivityWhen(solvedAt: Date, now = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - solvedAt.getTime());
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    const sameDay = solvedAt.toDateString() === now.toDateString();
    return sameDay ? "today" : `${diffHr}h ago`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (solvedAt.toDateString() === yesterday.toDateString()) return "yesterday";
  return solvedAt.toLocaleDateString();
}

export function normalizeDifficulty(value: string): "Easy" | "Medium" | "Hard" | "Unknown" {
  const v = value.trim().toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "medium") return "Medium";
  if (v === "hard") return "Hard";
  return "Unknown";
}
