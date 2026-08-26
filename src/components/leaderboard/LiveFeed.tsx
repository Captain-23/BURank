"use client";

import Image from "next/image";
import Link from "next/link";
import { formatActivityWhen, type ActivityPayload } from "@/lib/activity";

function difficultyClass(difficulty: string): string {
  const value = difficulty.toLowerCase();
  if (value === "easy") return "easy";
  if (value === "medium") return "medium";
  if (value === "hard") return "hard";
  return "";
}

export default function LiveFeed({
  events,
  loading,
}: {
  events: ActivityPayload[];
  loading: boolean;
}) {
  return (
    <div className="live-feed">
      <div className="live-feed-head">
        <h2>
          <span className="live-dot" aria-hidden />
          Live Feed
        </h2>
        <span className="live-feed-sub">Recent accepted solves</span>
      </div>

      {loading ? (
        <div className="live-feed-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="live-feed-item" key={i}>
              <div className="skeleton" style={{ height: 18, width: "100%" }} />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="live-feed-empty">
          No recent solves yet. The feed updates every 30 minutes with the
          leaderboard refresh.
        </p>
      ) : (
        <ul className="live-feed-list">
          {events.map((event) => {
            const name = event.realName || event.username;
            const when = formatActivityWhen(new Date(event.solvedAt));
            const problemHref = `https://leetcode.com/problems/${encodeURIComponent(event.titleSlug)}/`;
            const diffClass = difficultyClass(event.difficulty);
            return (
              <li
                key={`${event.username}-${event.titleSlug}-${event.solvedAt}`}
                className="live-feed-item"
              >
                {event.avatar ? (
                  <Image
                    className="live-feed-ava"
                    src={event.avatar}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                  />
                ) : (
                  <div className="live-feed-ava live-feed-ava-fallback">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
                <p className="live-feed-copy">
                  <Link href={`/user/${event.username}`} className="live-feed-user">
                    {name}
                  </Link>{" "}
                  solved{" "}
                  <a
                    href={problemHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="live-feed-problem"
                  >
                    {event.frontendId ? `#${event.frontendId} ` : ""}
                    {event.title}
                  </a>
                  {event.difficulty !== "Unknown" && (
                    <>
                      {" "}
                      <span className={`live-feed-diff ${diffClass}`}>
                        {event.difficulty}
                      </span>
                    </>
                  )}
                  {" · "}
                  <span className="live-feed-when">{when}</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
