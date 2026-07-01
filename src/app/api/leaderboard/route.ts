import { NextResponse } from "next/server";
import {
  fetchUsernamesFromSheet,
  getQuestionOfTheWeek,
  setFirstBlood,
} from "@/lib/sheets";
import { fetchLeetCodeUser } from "@/lib/leetcode";
import { LeetCodeUser } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let entries = await fetchUsernamesFromSheet();

    if (entries.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Remove duplicate usernames
    const uniqueEntries = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      if (!seen.has(entry.username)) {
        seen.add(entry.username);
        uniqueEntries.push(entry);
      }
    }

    entries = uniqueEntries;

    const CHUNK_SIZE = 5;
    const results: LeetCodeUser[] = [];

    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);

      const chunkResults = await Promise.all(
        chunk.map(async (entry) => {
          const user = await fetchLeetCodeUser(entry.username);

          if (!user) {
            return {
              username: entry.username,
              realName: entry.username,
              avatar: "",
              ranking: 999999999,
              totalSolved: 0,
              easySolved: 0,
              mediumSolved: 0,
              hardSolved: 0,
              acceptanceRate: 0,
              contestRating: 0,
              contestGlobalRanking: 0,
              attendedContestsCount: 0,
              topPercentage: 100,

              // Sheet data
              email: entry.email,
              addedAt: entry.addedAt,
              yearStudying: entry.yearStudying,
              enrollmentNo: entry.enrollmentNo,

              error: true,
            } satisfies LeetCodeUser;
          }

          return {
            ...user,

            // Sheet data
            email: entry.email,
            addedAt: entry.addedAt,
            yearStudying: entry.yearStudying,
            enrollmentNo: entry.enrollmentNo,
          };
        })
      );

      results.push(...chunkResults);

      if (i + CHUNK_SIZE < entries.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // ----------------------------
    // First Blood
    // ----------------------------

    const qotw = await getQuestionOfTheWeek();

    if (qotw.qotw_url && !qotw.first_blood) {
      const match = qotw.qotw_url.match(/problems\/([^/]+)/);
      const titleSlug = match ? match[1] : null;

      if (titleSlug && qotw.qotw_timestamp) {
        const qotwTime =
          new Date(qotw.qotw_timestamp).getTime() / 1000;

        let earliestSolver: string | null = null;
        let earliestTime = Infinity;

        for (const user of results) {
          if (!user.recentSubmissions) continue;

          for (const submission of user.recentSubmissions) {
            if (submission.titleSlug !== titleSlug) continue;

            const submissionTime = parseInt(
              submission.timestamp,
              10
            );

            if (
              submissionTime >= qotwTime &&
              submissionTime < earliestTime
            ) {
              earliestTime = submissionTime;
              earliestSolver = user.username;
            }
          }
        }

        if (earliestSolver) {
          setFirstBlood(earliestSolver).catch(console.error);
        }
      }
    }

    const cleanResults = results.map(
      ({ recentSubmissions, ...rest }) => rest
    );

    return NextResponse.json({
      users: cleanResults,
    });
  } catch (err) {
    console.error("/api/leaderboard error:", err);

    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
      },
      {
        status: 500,
      }
    );
  }
}