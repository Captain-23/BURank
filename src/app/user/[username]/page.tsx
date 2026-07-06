import { fetchLeetCodeUser, fetchLeetCodeCalendar } from "@/lib/leetcode";
import { fetchUsernamesFromSheet } from "@/lib/sheets";
import { computeBadges, getNextBadgeProgress } from "@/lib/badges";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import Heatmap from "@/components/Heatmap";
import NextBadgePopup from "@/components/profile/NextBadgePopup";
import ProfileActions from "@/components/profile/ProfileActions";
import ProfileBadges from "@/components/profile/ProfileBadges";

interface Props {
  params: { username: string };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = params;

  const [user, calendar, sheetUsers] = await Promise.all([
    fetchLeetCodeUser(username),
    fetchLeetCodeCalendar(username),
    fetchUsernamesFromSheet(),
  ]);

  if (!user) notFound();

  const sheetEntry = sheetUsers.find((u) => u.username === user.username);
  const yearStudying = sheetEntry?.yearStudying || "";
  const enrollmentNo = sheetEntry?.enrollmentNo || user.enrollmentNo;
  const badges = computeBadges(user);
  const nextBadge = getNextBadgeProgress(user);

  const headersList = headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const siteOrigin = host ? `${protocol}://${host}` : "";

  const max = Math.max(user.easySolved, user.mediumSolved, user.hardSolved, 1);
  const pct = (n: number) => `${Math.max(2, Math.round((n / max) * 100))}%`;

  return (
    <div style={{ minHeight: "100vh" }}>
      {nextBadge && <NextBadgePopup username={user.username} nextBadge={nextBadge} />}

      <div className="topbar">
        <Link className="back" href="/">
          ← Leaderboard
        </Link>
      </div>

      <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* header */}
        <div className="card header">
          {user.avatar ? (
            <Image
              className="p-ava"
              src={user.avatar}
              alt={user.username}
              width={108}
              height={108}
              unoptimized
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="p-ava" />
          )}
          <div className="p-id">
            <h1>{user.realName || user.username}</h1>
            <a
              href={`https://leetcode.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-handle p-handle-link"
            >
              @{user.username}
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 1.5H10.5V9.5M10.5 1.5L1.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </a>
            <div className="p-pills">
              <span className="pill rank">
                Global Rank · #{user.ranking?.toLocaleString() ?? "—"}
              </span>
              {yearStudying && <span className="pill year">Batch {yearStudying}</span>}
              <a
                href={`https://leetcode.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pill leetcode"
              >
                LeetCode Profile ↗
              </a>
            </div>
          </div>
          <div className="p-side">
            <div>
              <div className="lbl">Contest Rating</div>
              <div className="val">{user.contestRating > 0 ? user.contestRating : "—"}</div>
            </div>
            <div>
              <div className="lbl">Contests Attended</div>
              <div className="val">{user.attendedContestsCount}</div>
            </div>
          </div>
        </div>

        <ProfileBadges badges={badges} />

        {/* total solved + difficulty */}
        <div className="prow">
          <div className="card solved">
            <div className="lbl">Total Solved</div>
            <div className="big">{user.totalSolved}</div>
          </div>
          <div className="card diff">
            <h2>Difficulty Breakdown</h2>
            <div className="bar-row">
              <span className="name e">Easy</span>
              <div className="track">
                <div className="fill e" style={{ width: pct(user.easySolved) }} />
              </div>
              <span className="num">{user.easySolved}</span>
            </div>
            <div className="bar-row">
              <span className="name m">Medium</span>
              <div className="track">
                <div className="fill m" style={{ width: pct(user.mediumSolved) }} />
              </div>
              <span className="num">{user.mediumSolved}</span>
            </div>
            <div className="bar-row">
              <span className="name h">Hard</span>
              <div className="track">
                <div className="fill h" style={{ width: pct(user.hardSolved) }} />
              </div>
              <span className="num">{user.hardSolved}</span>
            </div>
          </div>
        </div>

        <ProfileActions
          username={user.username}
          enrollmentNo={enrollmentNo}
          siteOrigin={siteOrigin}
        />

        {/* calendar */}
        <div className="card cal">
          <div className="cal-head">
            <h2>Submission Calendar</h2>
            <span className="sub">Past 12 Months</span>
          </div>
          {calendar ? (
            <Heatmap data={calendar} />
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--sub)" }}>
              No activity data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
