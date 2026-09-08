import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEnrollmentNo } from "@/lib/enrollment";
import {
  backfillEnrollmentIfMissing,
  findRankedUserByEnrollment,
} from "@/lib/enrollment-sync";
import { getCachedRoster } from "@/lib/sheets";
import {
  CARD_THEMES,
  DEFAULT_CARD_THEME,
  isCardTheme,
  type CardTheme,
} from "@/lib/card-themes";

export const dynamic = "force-dynamic";

const COLLEGE = process.env.NEXT_PUBLIC_COLLEGE_NAME ?? "Bennett University";

// ─── helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Truncate long strings so they don't overflow the card */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ─── error card ─────────────────────────────────────────────────────────────

function errorCard(message: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="72"
    viewBox="0 0 440 72" role="img" aria-label="Error">
    <rect width="440" height="72" rx="6" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <text x="20" y="32" font-family="system-ui, sans-serif" font-size="11" fill="#71717a" letter-spacing="0.08em">BURANK</text>
    <text x="20" y="52" font-family="system-ui, sans-serif" font-size="13" fill="#f87171">${escapeXml(message)}</text>
  </svg>`;
}

// ─── main card SVG ───────────────────────────────────────────────────────────

function buildCard(opts: {
  username: string;
  realName: string;
  enrollmentNo: string;
  collegeRank: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  totalUsers: number;
  theme: CardTheme;
}): string {
  const {
    username,
    realName,
    collegeRank,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    totalUsers,
    theme,
  } = opts;
  const palette = CARD_THEMES[theme];

  const displayName = truncate(realName || username, 24);
  const displayUsername = truncate(username, 22);

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="440" height="96"
  viewBox="0 0 440 96"
  role="img"
  aria-label="${escapeXml(displayName)} — BURank card, college rank ${collegeRank}">

  <title>${escapeXml(displayName)} · BURank</title>
  <desc>
    ${escapeXml(COLLEGE)} LeetCode rank card for ${escapeXml(displayName)}.
    College rank: ${collegeRank} of ${totalUsers}. Total solved: ${totalSolved}.
  </desc>

  <rect width="440" height="96" rx="6" fill="${palette.background}" stroke="${palette.border}" stroke-width="1"/>
  <rect width="4" height="96" rx="2" fill="${palette.accent}"/>

  <text x="20" y="24"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="10" fill="${palette.labelText}" letter-spacing="0.1em">
    BURANK
  </text>

  <text x="420" y="24"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="10" fill="${palette.dim}"
    text-anchor="end">
    burank.app
  </text>

  <text x="20" y="50"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="15" font-weight="600"
    fill="${palette.text}">
    ${escapeXml(displayName)}
  </text>

  <text x="20" y="70"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
    font-size="11" fill="${palette.muted}">
    @${escapeXml(displayUsername)}
  </text>

  <text x="420" y="50"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="10" fill="${palette.labelText}"
    text-anchor="end" letter-spacing="0.06em">
    RANK
  </text>

  <text x="420" y="70"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
    font-size="15" font-weight="600"
    fill="${palette.text}"
    text-anchor="end">
    ${ordinal(collegeRank)}
  </text>

  <text x="300" y="50"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="10" fill="${palette.labelText}"
    text-anchor="end" letter-spacing="0.06em">
    SOLVED
  </text>

  <text x="300" y="70"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
    font-size="15" font-weight="600"
    fill="${palette.text}"
    text-anchor="end">
    ${totalSolved}
  </text>

  <text x="420" y="86"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="9" fill="${palette.dim}"
    text-anchor="end">
    of ${totalUsers}
  </text>

  <text x="300" y="86"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
    font-size="9"
    text-anchor="end">
    <tspan fill="#10b981">${easySolved}</tspan><tspan fill="#52525b"> · </tspan><tspan fill="#f59e0b">${mediumSolved}</tspan><tspan fill="#52525b"> · </tspan><tspan fill="#ef4444">${hardSolved}</tspan>
  </text>

</svg>`;
}

// ─── route handler ───────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { enrollment: string } },
) {
  const enrollment = normalizeEnrollmentNo(
    decodeURIComponent(params.enrollment ?? ""),
  );

  if (!enrollment) {
    return new NextResponse(errorCard("No enrollment number provided."), {
      status: 400,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  try {
    const [rows, roster] = await Promise.all([
      prisma.userStat.findMany({
        orderBy: { totalSolved: "desc" },
      }),
      getCachedRoster(),
    ]);

    const match = findRankedUserByEnrollment(rows, roster, enrollment);

    if (!match) {
      return new NextResponse(
        errorCard(`Enrollment number "${enrollment.toUpperCase()}" not found.`),
        {
          status: 404,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const { idx, enrollmentNo: resolvedEnrollment } = match;
    const me = rows[idx];

    // Self-heal: persist enrollment from the roster when the cache row is missing it.
    if (!me.enrollmentNo) {
      await backfillEnrollmentIfMissing(me.username, resolvedEnrollment);
    }

    const svg = buildCard({
      username: me.username,
      realName: me.realName || me.username,
      enrollmentNo: resolvedEnrollment,
      collegeRank: idx + 1,
      totalSolved: me.totalSolved,
      easySolved: me.easySolved,
      mediumSolved: me.mediumSolved,
      hardSolved: me.hardSolved,
      contestRating: me.contestRating,
      totalUsers: rows.length,
      theme: isCardTheme(_req.nextUrl.searchParams.get("theme") ?? "")
        ? (_req.nextUrl.searchParams.get("theme") as CardTheme)
        : DEFAULT_CARD_THEME,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("/card/[enrollment] error:", err);
    return new NextResponse(errorCard("Server error. Try again later."), {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
      },
    });
  }
}
