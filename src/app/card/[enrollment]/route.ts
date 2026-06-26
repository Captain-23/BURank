import { NextRequest, NextResponse } from "next/server";
import { fetchUsernamesFromSheet } from "@/lib/sheets";
import { fetchLeetCodeUser } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

// Cache the SVG for 10 minutes per enrollment number
export const revalidate = 600;

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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120"
    viewBox="0 0 480 120" role="img" aria-label="Error">
    <rect width="480" height="120" rx="8" fill="#111118" stroke="#1E1E2E" stroke-width="1"/>
    <text x="24" y="56" font-family="monospace" font-size="14" fill="#ff375f">${escapeXml(message)}</text>
    <text x="24" y="80" font-family="monospace" font-size="12" fill="#8888a8">
      Check your enrollment number and try again.
    </text>
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
}): string {
  const {
    username,
    realName,
    enrollmentNo,
    collegeRank,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    contestRating,
    totalUsers,
  } = opts;

  const displayName = truncate(realName || username, 22);
  const displayEnrollment = truncate(enrollmentNo.toUpperCase(), 16);
  const displayUsername = truncate(username, 20);

  // Progress bar: rank position as percentage (inverted — rank 1 = full bar)
  const rankPct =
    totalUsers > 1
      ? Math.round(((totalUsers - collegeRank) / (totalUsers - 1)) * 100)
      : 100;
  const barWidth = Math.round((rankPct / 100) * 200);

  // Ordinal suffix for rank
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="480" height="168"
  viewBox="0 0 480 168"
  role="img"
  aria-label="${escapeXml(displayName)} — BUrge LeetCode card, college rank ${collegeRank}">

  <title>${escapeXml(displayName)} · BUrge LeetCode Card</title>
  <desc>
    ${escapeXml(COLLEGE)} LeetCode rank card for ${escapeXml(displayName)}.
    College rank: ${collegeRank} of ${totalUsers}. Total solved: ${totalSolved}.
  </desc>

  <defs>
    <linearGradient id="redFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C8102E"/>
      <stop offset="100%" stop-color="#ff4d6d"/>
    </linearGradient>
    <clipPath id="barClip">
      <rect x="0" y="0" width="${barWidth}" height="6" rx="3"/>
    </clipPath>
  </defs>

  <!-- Card background -->
  <rect width="480" height="168" rx="8" fill="#111118"/>

  <!-- Top red accent bar -->
  <rect width="480" height="3" rx="0" fill="#C8102E"/>

  <!-- Left border accent -->
  <rect x="0" y="3" width="3" height="165" fill="#C8102E" opacity="0.4"/>

  <!-- ── LEFT COLUMN: identity ───────────────────────────── -->

  <!-- Avatar circle -->
  <circle cx="44" cy="52" r="20" fill="#1E1E2E"/>
  <text x="44" y="58"
    font-family="Inter, system-ui, sans-serif"
    font-size="18" font-weight="600"
    fill="#C8102E"
    text-anchor="middle">
    ${escapeXml(displayName[0]?.toUpperCase() ?? "?")}
  </text>

  <!-- Name -->
  <text x="76" y="45"
    font-family="Inter, system-ui, sans-serif"
    font-size="15" font-weight="600"
    fill="#E2E2F0">
    ${escapeXml(displayName)}
  </text>

  <!-- Enrollment + username -->
  <text x="76" y="63"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="11"
    fill="#8888A8">
    ${escapeXml(displayEnrollment)} · @${escapeXml(displayUsername)}
  </text>

  <!-- College name -->
  <text x="76" y="79"
    font-family="Inter, system-ui, sans-serif"
    font-size="10"
    fill="#555570"
    letter-spacing="0.04em">
    ${escapeXml(COLLEGE.toUpperCase())}
  </text>

  <!-- Divider -->
  <line x1="24" y1="98" x2="456" y2="98" stroke="#1E1E2E" stroke-width="1"/>

  <!-- ── BOTTOM ROW: stats ───────────────────────────────── -->

  <!-- Stat 1: College rank -->
  <text x="40" y="122"
    font-family="Inter, system-ui, sans-serif"
    font-size="10" fill="#8888A8"
    letter-spacing="0.06em">
    COLLEGE RANK
  </text>
  <text x="40" y="144"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="22" font-weight="700"
    fill="#C8102E">
    ${ordinal(collegeRank)}
  </text>
  <text x="40" y="158"
    font-family="Inter, system-ui, sans-serif"
    font-size="10" fill="#555570">
    of ${totalUsers} coders
  </text>

  <!-- Divider -->
  <line x1="126" y1="108" x2="126" y2="160" stroke="#1E1E2E" stroke-width="1"/>

  <!-- Stat 2: Total solved -->
  <text x="142" y="122"
    font-family="Inter, system-ui, sans-serif"
    font-size="10" fill="#8888A8"
    letter-spacing="0.06em">
    SOLVED
  </text>
  <text x="142" y="144"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="22" font-weight="700"
    fill="#E2E2F0">
    ${totalSolved}
  </text>
  <!-- E / M / H breakdown -->
  <text x="142" y="158"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="10">
    <tspan fill="#00B8A3">${easySolved}E</tspan>
    <tspan fill="#555570"> · </tspan>
    <tspan fill="#FFC01E">${mediumSolved}M</tspan>
    <tspan fill="#555570"> · </tspan>
    <tspan fill="#FF375F">${hardSolved}H</tspan>
  </text>

  <!-- Divider -->
  <line x1="240" y1="108" x2="240" y2="160" stroke="#1E1E2E" stroke-width="1"/>

  <!-- Stat 3: Contest rating -->
  <text x="256" y="122"
    font-family="Inter, system-ui, sans-serif"
    font-size="10" fill="#8888A8"
    letter-spacing="0.06em">
    CONTEST
  </text>
  <text x="256" y="144"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="22" font-weight="700"
    fill="#E2E2F0">
    ${contestRating > 0 ? contestRating : "—"}
  </text>
  <text x="256" y="158"
    font-family="Inter, system-ui, sans-serif"
    font-size="10" fill="#555570">
    rating
  </text>

  <!-- Rank progress bar -->
  <text x="356" y="122"
    font-family="Inter, system-ui, sans-serif"
    font-size="10" fill="#8888A8"
    letter-spacing="0.06em">
    RANK PROGRESS
  </text>
  <!-- Bar track -->
  <rect x="356" y="132" width="100" height="6" rx="3" fill="#1E1E2E"/>
  <!-- Bar fill -->
  <rect x="356" y="132" width="${barWidth / 2}" height="6" rx="3" fill="url(#redFade)"/>
  <text x="356" y="153"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="10" fill="#8888A8">
    Top ${Math.max(1, Math.round((collegeRank / totalUsers) * 100))}%
  </text>

  <!-- BUrge watermark -->
  <text x="456" y="158"
    font-family="'JetBrains Mono', 'Fira Code', monospace"
    font-size="10" fill="#2A2A3E"
    text-anchor="end">
    burge.vercel.app
  </text>

</svg>`;
}

// ─── route handler ───────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { enrollment: string } },
) {
  const enrollment = (params.enrollment ?? "").trim().toLowerCase();

  if (!enrollment) {
    return new NextResponse(errorCard("No enrollment number provided."), {
      status: 400,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  try {
    // 1. Load all sheet entries
    const entries = await fetchUsernamesFromSheet();

    // 2. Find the entry matching this enrollment number
    const entry = entries.find(
      (e) => e.enrollmentNo?.toLowerCase() === enrollment,
    );

    if (!entry) {
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

    // 3. Fetch all users' stats to compute college rank
    const allUsers = await Promise.all(
      entries.map((e) => fetchLeetCodeUser(e.username)),
    );

    // Filter out failed fetches and sort by totalSolved descending
    const validUsers = allUsers
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .sort((a, b) => b.totalSolved - a.totalSolved);

    // 4. Find rank of this specific user
    const thisUser = validUsers.find(
      (u) => u.username.toLowerCase() === entry.username.toLowerCase(),
    );

    if (!thisUser) {
      return new NextResponse(
        errorCard("Could not fetch LeetCode data. Try again later."),
        {
          status: 502,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const collegeRank =
      validUsers.findIndex(
        (u) => u.username.toLowerCase() === thisUser.username.toLowerCase(),
      ) + 1;

    // 5. Build and return the SVG
    const svg = buildCard({
      username: thisUser.username,
      realName: thisUser.realName,
      enrollmentNo: enrollment,
      collegeRank,
      totalSolved: thisUser.totalSolved,
      easySolved: thisUser.easySolved,
      mediumSolved: thisUser.mediumSolved,
      hardSolved: thisUser.hardSolved,
      contestRating: thisUser.contestRating,
      totalUsers: validUsers.length,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        // GitHub CDN caches for 5 min; revalidate after 10 min
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
