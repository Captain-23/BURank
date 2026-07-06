import { parseRosterCsv } from "../src/lib/roster";
import { computeFirstBlood } from "../src/lib/first-blood";
import { fetchLeetCodeUser } from "../src/lib/leetcode";

const SHEET_CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL;
const SITE_URL = process.env.SITE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

const CHUNK = 5;
const DELAY_MS = 300;

async function main() {
  if (!SHEET_CSV_URL || !SITE_URL || !CRON_SECRET) {
    throw new Error(
      "Missing required env: NEXT_PUBLIC_SHEET_CSV_URL, SITE_URL, CRON_SECRET",
    );
  }

  // 1. Roster
  const csvRes = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`, {
    cache: "no-store",
  });
  if (!csvRes.ok) throw new Error(`Sheet fetch failed: ${csvRes.status}`);
  const roster = parseRosterCsv(await csvRes.text());

  // Dedupe by username
  const seen = new Set<string>();
  const entries = roster.filter((e) => {
    if (seen.has(e.username)) return false;
    seen.add(e.username);
    return true;
  });

  // 2. Fetch LeetCode stats, throttled
  const users: Array<Record<string, unknown>> = [];
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async (e) => {
        const u = await fetchLeetCodeUser(e.username);
        if (!u) {
          return {
            username: e.username,
            realName: e.username,
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
            email: e.email,
            enrollmentNo: e.enrollmentNo,
            yearStudying: e.yearStudying,
            addedAt: e.addedAt,
            fetchError: true,
            recentSubmissions: [],
          };
        }
        return {
          ...u,
          email: e.email,
          enrollmentNo: e.enrollmentNo,
          yearStudying: e.yearStudying,
          addedAt: e.addedAt,
          fetchError: false,
        };
      }),
    );
    users.push(...results);
    if (i + CHUNK < entries.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // 3. First Blood — read current QOTW settings from the deployed app.
  const qotwRes = await fetch(`${SITE_URL}/api/qotw`, { cache: "no-store" });
  const qotw = qotwRes.ok
    ? await qotwRes.json()
    : { qotw_url: "", qotw_timestamp: "", first_blood: "" };
  const firstBlood =
    qotw.first_blood ||
    computeFirstBlood(
      users as { username: string; recentSubmissions?: { titleSlug: string; timestamp: string }[] }[],
      qotw.qotw_url || "",
      qotw.qotw_timestamp || "",
    ) ||
    "";

  // 4. POST to ingest (strip recentSubmissions — not stored)
  const payload = {
    users: users.map(({ recentSubmissions, ...rest }) => rest),
    settings: { first_blood: firstBlood },
  };

  const res = await fetch(`${SITE_URL}/api/cron/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Ingest failed: ${res.status} ${await res.text()}`);
  }

  console.log(
    `Refreshed ${users.length} users; first_blood=${firstBlood || "none"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
