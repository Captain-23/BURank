import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEnrollmentNo } from "@/lib/enrollment";
import { getCachedRoster } from "@/lib/sheets";
import { LeetCodeUser } from "@/types";

// Always read live UserStat rows. A 5-minute Data Cache here kept deleted
// users on the dashboard until the next revalidate window.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [rows, roster] = await Promise.all([
      prisma.userStat.findMany({ orderBy: { totalSolved: "desc" } }),
      getCachedRoster(),
    ]);
    const rosterByUser = new Map(roster.map((entry) => [entry.username, entry]));

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
      enrollmentNo: resolveEnrollmentNo([
        r.enrollmentNo,
        rosterByUser.get(r.username)?.enrollmentNo,
      ]),
      error: r.fetchError,
    }));

    return NextResponse.json(
      { users },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (err) {
    console.error("/api/leaderboard error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
