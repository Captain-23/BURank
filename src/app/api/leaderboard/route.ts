import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LeetCodeUser } from "@/types";

// Run on-demand (never prerendered at build), but the DB read below is served
// from the Data Cache, so most requests don't touch Postgres.
export const dynamic = "force-dynamic";

// Cache the DB read and reuse it across requests. The cache is dropped whenever
// data changes via revalidateTag("leaderboard") (cron ingest / register / delete),
// with a 5-minute safety-net revalidate. Between refreshes this route serves
// from the cache and never touches Postgres.
const getLeaderboard = unstable_cache(
  async () =>
    prisma.userStat.findMany({ orderBy: { totalSolved: "desc" } }),
  ["leaderboard-rows"],
  { tags: ["leaderboard"], revalidate: 300 },
);

export async function GET() {
  try {
    const rows = await getLeaderboard();

    const users: LeetCodeUser[] = rows.map((r) => ({
      username: r.username,
      realName: r.realName || r.username,
      avatar: r.avatar || "",
      ranking: r.ranking ?? 0,
      totalSolved: r.totalSolved,
      easySolved: r.easySolved,
      mediumSolved: r.mediumSolved,
      hardSolved: r.hardSolved,
      acceptanceRate: 0,
      contestRating: r.contestRating,
      contestGlobalRanking: r.contestGlobalRanking,
      attendedContestsCount: r.attendedContestsCount,
      topPercentage: r.topPercentage,
      email: r.email ?? "",
      addedAt: r.addedAt ?? "",
      yearStudying: r.yearStudying ?? "",
      enrollmentNo: r.enrollmentNo ?? "",
      error: r.fetchError,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error("/api/leaderboard error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
