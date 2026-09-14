import { parseRosterCsv } from "./roster";
import { computeFirstBlood } from "./first-blood";
import { fetchLeetCodeUser, fetchQuestionMeta } from "./leetcode";
import { withCacheBust } from "./csv-url";
import {
  ACTIVITY_RETENTION_MS,
  buildActivityPayload,
  collectRecentSlugs,
  type ProblemMeta,
  type RawSubmission,
} from "./activity";

const CHUNK = 5;
const DELAY_MS = 300;

export async function refreshLeaderboard() {
  const sheetCsvUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL;
  const siteUrl = process.env.SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!sheetCsvUrl || !siteUrl || !cronSecret) {
    throw new Error(
      "Missing required env: NEXT_PUBLIC_SHEET_CSV_URL, SITE_URL, CRON_SECRET",
    );
  }

  const csvRes = await fetch(withCacheBust(sheetCsvUrl), { cache: "no-store" });
  if (!csvRes.ok) throw new Error(`Sheet fetch failed: ${csvRes.status}`);
  const roster = parseRosterCsv(await csvRes.text());

  const seen = new Set<string>();
  const entries = roster.filter((entry) => {
    if (seen.has(entry.username)) return false;
    seen.add(entry.username);
    return true;
  });

  const users: Array<Record<string, unknown>> = [];
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async (entry) => {
        const user = await fetchLeetCodeUser(entry.username);
        if (!user) {
          return {
            username: entry.username,
            realName: entry.username,
            avatar: "",
            ranking: 0,
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            contestRating: 0,
            contestGlobalRanking: 0,
            attendedContestsCount: 0,
            topPercentage: 100,
            email: entry.email,
            enrollmentNo: entry.enrollmentNo,
            yearStudying: entry.yearStudying,
            addedAt: entry.addedAt,
            fetchError: true,
            recentSubmissions: [],
          };
        }
        return {
          ...user,
          email: entry.email,
          enrollmentNo: entry.enrollmentNo,
          yearStudying: entry.yearStudying,
          addedAt: entry.addedAt,
          fetchError: false,
        };
      }),
    );
    users.push(...results);
    if (i + CHUNK < entries.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const qotwRes = await fetch(`${siteUrl}/api/qotw`, { cache: "no-store" });
  const qotw = qotwRes.ok
    ? await qotwRes.json()
    : { qotw_url: "", qotw_timestamp: "", first_blood: "" };
  const firstBlood =
    qotw.first_blood ||
    computeFirstBlood(
      users as {
        username: string;
        recentSubmissions?: { titleSlug: string; timestamp: string }[];
      }[],
      qotw.qotw_url || "",
      qotw.qotw_timestamp || "",
    ) ||
    "";

  const since = new Date(Date.now() - ACTIVITY_RETENTION_MS);
  const problemMap: Record<string, ProblemMeta> = {};
  try {
    const problemRes = await fetch(`${siteUrl}/api/problems`, {
      cache: "no-store",
    });
    if (problemRes.ok) {
      const data = (await problemRes.json()) as { problems?: ProblemMeta[] };
      for (const problem of data.problems ?? []) {
        if (problem?.titleSlug) problemMap[problem.titleSlug] = problem;
      }
    }
  } catch (error) {
    console.warn("Could not load cached problems:", error);
  }

  const feedUsers = users as Array<{
    username: string;
    realName?: string;
    avatar?: string;
    fetchError?: boolean;
    recentSubmissions?: RawSubmission[];
  }>;
  const missing = collectRecentSlugs(feedUsers, since).filter(
    (slug) => !problemMap[slug],
  );
  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK);
    const metas = await Promise.all(chunk.map((slug) => fetchQuestionMeta(slug)));
    for (const meta of metas) {
      if (meta) problemMap[meta.titleSlug] = meta;
    }
    if (i + CHUNK < missing.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const activities = buildActivityPayload(feedUsers, problemMap, since);
  const payload = {
    users: users.map(({ recentSubmissions, ...rest }) => rest),
    settings: { first_blood: firstBlood },
    problems: Object.values(problemMap),
    activities,
  };

  const ingestRes = await fetch(`${siteUrl}/api/cron/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`,
    },
    body: JSON.stringify(payload),
  });
  if (!ingestRes.ok) {
    throw new Error(`Ingest failed: ${ingestRes.status} ${await ingestRes.text()}`);
  }

  const summary = `Refreshed ${users.length} users; first_blood=${firstBlood || "none"}; activities=${activities.length}`;
  console.log(summary);
  return { users: users.length, activities: activities.length, firstBlood };
}