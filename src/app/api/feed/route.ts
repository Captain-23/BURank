import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FEED_WINDOW_MS } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const since = new Date(Date.now() - FEED_WINDOW_MS);
    const rows = await prisma.activityEvent.findMany({
      where: { solvedAt: { gte: since } },
      orderBy: { solvedAt: "desc" },
      take: 40,
    });

    const usernames = [...new Set(rows.map((row) => row.username))];
    const stats = usernames.length
      ? await prisma.userStat.findMany({
          where: { username: { in: usernames } },
          select: { username: true, avatar: true, realName: true },
        })
      : [];
    const byUser = new Map(stats.map((row) => [row.username, row]));

    const events = rows.map((row) => {
      const live = byUser.get(row.username);
      return {
        username: row.username,
        realName: live?.realName || row.realName,
        avatar: live?.avatar || row.avatar,
        title: row.title,
        titleSlug: row.titleSlug,
        frontendId: row.frontendId,
        difficulty: row.difficulty,
        solvedAt: row.solvedAt.toISOString(),
      };
    });

    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (err) {
    console.error("/api/feed error:", err);
    return NextResponse.json(
      { events: [] },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
