"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatActivityWhen, type ActivityPayload } from "@/lib/activity";

/** How often (ms) to re-fetch the feed in the background. */
const POLL_INTERVAL_MS = 60_000;

/** Solves within this window get a "NEW" badge. */
const NEW_THRESHOLD_MS = 10 * 60_000;

/** How many items to show before offering "Show more". */
const COLLAPSED_LIMIT = 5;

function difficultyClass(difficulty: string): string {
  const value = difficulty.toLowerCase();
  if (value === "easy") return "easy";
  if (value === "medium") return "medium";
  if (value === "hard") return "hard";
  return "";
}

function isNew(solvedAt: string, now: number): boolean {
  return now - new Date(solvedAt).getTime() < NEW_THRESHOLD_MS;
}

export default function LiveFeed({
  events: initialEvents,
  loading: initialLoading,
}: {
  events: ActivityPayload[];
  loading: boolean;
}) {
  const [events, setEvents] = useState<ActivityPayload[]>(initialEvents);
  const [loading, setLoading] = useState(initialLoading);
  const [expanded, setExpanded] = useState(false);
  const [tick, setTick] = useState(Date.now());

  // Sync props → state when the parent re-fetches (manual refresh, initial load)
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);
  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  // Auto-poll the feed endpoint to keep it feeling live
  const pollFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch {
      // Silently ignore — the feed will retry next interval
    }
  }, []);

  useEffect(() => {
    const id = setInterval(pollFeed, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollFeed]);

  // Tick every 30 s so relative times ("2m ago") stay current
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const visibleEvents = useMemo(
    () => (expanded ? events : events.slice(0, COLLAPSED_LIMIT)),
    [events, expanded],
  );
  const canExpand = events.length > COLLAPSED_LIMIT;

  return (
    <div className="live-feed">
      <div className="live-feed-head">
        <h2>
          <span className="live-dot" aria-hidden />
          Recent Activity
          {!loading && events.length > 0 && (
            <span className="live-feed-count">{events.length}</span>
          )}
        </h2>
        <span className="live-feed-sub">Recent submissions</span>
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
          No recent solves yet. The feed updates every 15 minutes with the
          leaderboard refresh.
        </p>
      ) : (
        <>
          <ul className={`live-feed-list${expanded ? " expanded" : ""}`}>
            {visibleEvents.map((event) => {
              const name = event.realName || event.username;
              const when = formatActivityWhen(
                new Date(event.solvedAt),
                new Date(tick),
              );
              const problemHref = `https://leetcode.com/problems/${encodeURIComponent(event.titleSlug)}/`;
              const diffClass = difficultyClass(event.difficulty);
              const fresh = isNew(event.solvedAt, tick);
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
                    <Link
                      href={`/user/${event.username}`}
                      className="live-feed-user"
                    >
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
                    {fresh && <span className="live-feed-new">NEW</span>}
                  </p>
                </li>
              );
            })}
          </ul>
          {canExpand && (
            <button
              className={`live-feed-toggle${expanded ? " expanded" : ""}`}
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Show less" : "Show more"}
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}
