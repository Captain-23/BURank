import { NextResponse } from "next/server";
import { fetchUsernamesFromSheet } from "@/lib/sheets";
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

    // Deduplicate in case the sheet has identical usernames
    const uniqueEntries = [];
    const seen = new Set<string>();
    for (const e of entries) {
      if (!seen.has(e.username)) {
        seen.add(e.username);
        uniqueEntries.push(e);
      }
    }
    entries = uniqueEntries;

    // Fetch all users in parallel (with concurrency limit to avoid rate limiting)
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
              addedAt: entry.addedAt,
              yearStudying: entry.yearStudying,
              enrollmentNo: entry.enrollmentNo,
              error: true,
            } satisfies LeetCodeUser;
          }
          return { ...user, addedAt: entry.addedAt, yearStudying: entry.yearStudying, enrollmentNo: entry.enrollmentNo };
        })
      );
      results.push(...chunkResults);

      // Small delay between chunks to be respectful of rate limits
      if (i + CHUNK_SIZE < entries.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return NextResponse.json({ users: results });
  } catch (err) {
    console.error("/api/leaderboard error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
