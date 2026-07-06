import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeStaleUsernames } from "@/lib/ingest-reconcile";

export const dynamic = "force-dynamic";

interface IngestUser {
  username: string;
  realName?: string;
  avatar?: string;
  ranking?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  contestRating?: number;
  contestGlobalRanking?: number;
  attendedContestsCount?: number;
  topPercentage?: number;
  email?: string;
  enrollmentNo?: string;
  yearStudying?: string;
  addedAt?: string;
  fetchError?: boolean;
}

interface IngestBody {
  users: IngestUser[];
  settings?: Record<string, string | null | undefined>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const users = Array.isArray(body.users) ? body.users : [];
  if (users.length === 0) {
    return NextResponse.json({ error: "No users provided" }, { status: 400 });
  }

  const now = new Date();

  // Build every upsert up front, then run them in a single transaction —
  // one round-trip / atomic apply instead of N sequential awaits.
  const upserts = users.map((u) => {
    const username = u.username.toLowerCase();
    const meta = {
      realName: u.realName ?? null,
      avatar: u.avatar ?? null,
      ranking: u.ranking ?? null,
      email: u.email ?? null,
      enrollmentNo: u.enrollmentNo ?? null,
      yearStudying: u.yearStudying ?? null,
      addedAt: u.addedAt ?? null,
    };

    if (u.fetchError) {
      // Preserve last-good stats: update only metadata + the error flag.
      return prisma.userStat.upsert({
        where: { username },
        update: { ...meta, fetchError: true, lastFetchedAt: now },
        create: {
          username,
          ...meta,
          fetchError: true,
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          contestRating: 0,
          contestGlobalRanking: 0,
          attendedContestsCount: 0,
          topPercentage: 100,
          lastFetchedAt: now,
        },
      });
    }

    const stats = {
      totalSolved: u.totalSolved ?? 0,
      easySolved: u.easySolved ?? 0,
      mediumSolved: u.mediumSolved ?? 0,
      hardSolved: u.hardSolved ?? 0,
      contestRating: u.contestRating ?? 0,
      contestGlobalRanking: u.contestGlobalRanking ?? 0,
      attendedContestsCount: u.attendedContestsCount ?? 0,
      topPercentage: u.topPercentage ?? 100,
    };
    return prisma.userStat.upsert({
      where: { username },
      update: { ...meta, ...stats, fetchError: false, lastFetchedAt: now },
      create: { username, ...meta, ...stats, fetchError: false, lastFetchedAt: now },
    });
  });

  await prisma.$transaction(upserts);

  // Reconcile: delete rows whose username is no longer in the roster.
  const existing = (
    await prisma.userStat.findMany({ select: { username: true } })
  ).map((r) => r.username);
  const stale = computeStaleUsernames(
    existing,
    users.map((u) => u.username),
  );
  if (stale.length > 0) {
    await prisma.userStat.deleteMany({ where: { username: { in: stale } } });
  }

  // Settings: upsert any provided non-empty keys in one transaction.
  if (body.settings) {
    const settingOps = Object.entries(body.settings)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        }),
      );
    if (settingOps.length > 0) {
      await prisma.$transaction(settingOps);
      revalidateTag("settings");
    }
  }

  // Fresh data available — drop the cached reads.
  revalidateTag("leaderboard");

  return NextResponse.json({
    ok: true,
    upserted: users.length,
    deleted: stale.length,
  });
}
