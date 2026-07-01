"use client";

import { computeBadges } from "@/lib/badges";
import BadgeList from "@/components/BadgeList";
import UserProfileModal from "@/components/UserProfileModal";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddUserModal from "@/components/AddUserModal";
import SkeletonRows from "@/components/SkeletonRows";
import StatCard from "@/components/StatCard";
import { LeetCodeUser, SortKey, SortDirection } from "@/types";
import Navbar from "@/components/Navbar";
import { useSession, signIn, signOut } from "next-auth/react";
const COLLEGE = process.env.NEXT_PUBLIC_COLLEGE_NAME ?? "Bennett University";

type Filter = "all" | "top10" | "contested";
type ViewMode = "individuals" | "batches";

interface BatchData {
  year: string;
  totalStudents: number;
  totalSolved: number;
  avgSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeetCodeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("totalSolved");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [qotw, setQotw] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("individuals");
  const [firstBlood, setFirstBlood] = useState<string>("");
  const { data: session } = useSession();
  const currentEmail = session?.user?.email ?? null;

  const isRegistered = users.some(
    (u: any) => u.email?.toLowerCase() === currentEmail?.toLowerCase(),
  );

  const [selectedUser, setSelectedUser] = useState<{
    user: LeetCodeUser;

    rank: number;
  } | null>(null);
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, qotwRes] = await Promise.all([
        fetch("/api/leaderboard", { cache: "no-store" }),
        fetch("/api/qotw", { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const qotwData = await qotwRes.json();

      setUsers(data.users ?? []);
      setQotw(qotwData.qotw_url || "");
      setFirstBlood(qotwData.first_blood || "");

      setLastRefreshed(new Date());
    } catch {
      setError("Could not load leaderboard. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Sort + filter logic
  const processed = useMemo(() => {
    let list = [...users].filter((u) => !u.error);

    if (filter === "top10") list = list.slice(0, 10);
    if (filter === "contested")
      list = list.filter((u) => u.attendedContestsCount > 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.realName.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      if (sortKey === "ranking") return mult * (a.ranking - b.ranking) * -1; // lower rank number = better
      if (sortKey === "yearStudying") {
        const aVal = a.yearStudying || "";
        const bVal = b.yearStudying || "";
        return mult * aVal.localeCompare(bVal);
      }
      return mult * ((a[sortKey] as number) - (b[sortKey] as number));
    });

    return list;
  }, [users, search, sortKey, sortDir, filter]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "ranking" ? "asc" : "desc");
    }
  };

  // Batch stats logic
  const batchStats = useMemo(() => {
    const batches: Record<string, BatchData> = {};

    users
      .filter((u) => !u.error)
      .forEach((u) => {
        const year = u.yearStudying || "Unknown";
        if (!batches[year]) {
          batches[year] = {
            year,
            totalStudents: 0,
            totalSolved: 0,
            avgSolved: 0,
            totalEasy: 0,
            totalMedium: 0,
            totalHard: 0,
          };
        }
        batches[year].totalStudents++;
        batches[year].totalSolved += u.totalSolved;
        batches[year].totalEasy += u.easySolved;
        batches[year].totalMedium += u.mediumSolved;
        batches[year].totalHard += u.hardSolved;
      });

    return Object.values(batches)
      .map((b) => {
        b.avgSolved = Math.round(b.totalSolved / b.totalStudents);
        return b;
      })
      .sort((a, b) => b.avgSolved - a.avgSolved);
  }, [users]);

  // Summary stats
  const totalSolvedAll = users
    .filter((u) => !u.error)
    .reduce((a, u) => a + u.totalSolved, 0);
  const topRating = Math.max(
    ...users.filter((u) => !u.error).map((u) => u.contestRating),
    0,
  );
  const avgSolved =
    users.filter((u) => !u.error).length > 0
      ? Math.round(totalSolvedAll / users.filter((u) => !u.error).length)
      : 0;

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1 opacity-60">{sortDir === "desc" ? "↓" : "↑"}</span>
    ) : (
      <span className="ml-1 opacity-20">↕</span>
    );

  const getRankDisplay = (rank: number) => {
    if (rank === 1)
      return <span className="rank-1 font-mono font-bold text-lg">🥇</span>;
    if (rank === 2)
      return <span className="rank-2 font-mono font-bold text-lg">🥈</span>;
    if (rank === 3)
      return <span className="rank-3 font-mono font-bold text-lg">🥉</span>;
    return (
      <span className="font-mono text-sm" style={{ color: "var(--bu-sub)" }}>
        #{rank}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bu-dark)" }}>
      <Navbar />
      {/* Top gradient accent */}
      <div
        className="h-1 w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--bu-red), #ff6b6b, var(--bu-red))",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ background: "var(--bu-red)" }}
                />
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {COLLEGE}
                </h1>
              </div>
              <p className="text-sm pl-5" style={{ color: "var(--bu-sub)" }}>
                LeetCode Leaderboard · {users.filter((u) => !u.error).length}{" "}
                coders registered
                {lastRefreshed && (
                  <span className="ml-2 opacity-60">
                    · Refreshed {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLeaderboard}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all border disabled:opacity-40"
                style={{
                  borderColor: "var(--bu-border)",
                  color: "var(--bu-sub)",
                  background: "var(--bu-card)",
                }}
              >
                {loading ? "↻ Loading..." : "↻ Refresh"}
              </button>
              {session ? (
                <div className="flex items-center gap-3">
                  {!isRegistered && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                      style={{ background: "var(--bu-red)" }}
                    >
                      + Join Leaderboard
                    </button>
                  )}

                  <div className="flex items-center gap-3 bg-[var(--bu-card)] border border-[var(--bu-border)] rounded-xl px-4 py-2">
                    <span className="text-sm font-medium text-white">
                      {session.user?.email}
                    </span>

                    <button
                      onClick={handleLogout}
                      className="text-xs text-[var(--bu-red)] font-bold hover:underline"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    signIn(undefined, { callbackUrl: "/" });
                  }}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                  style={{ background: "var(--bu-red)" }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Question of the Week Banner */}
        {qotw && (
          <div
            className="mb-8 rounded-2xl p-6 border relative overflow-hidden animate-fade-in group"
            style={{
              background: "var(--bu-card)",
              borderColor: "var(--bu-red)",
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg border"
                  style={{
                    background: "var(--bu-dark)",
                    borderColor: "var(--bu-border)",
                    color: "var(--bu-red)",
                  }}
                >
                  🔥
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Question of the Week
                    {firstBlood && (
                      <span className="ml-3 text-sm font-medium px-2 py-1 bg-red-500/20 text-red-400 rounded-md border border-red-500/30">
                        🩸 First Blood: {firstBlood}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--bu-sub)" }}>
                    Solve this challenge to sharpen your skills!
                  </p>
                </div>
              </div>
              <a
                href={qotw}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
                style={{ background: "var(--bu-red)" }}
              >
                Solve on LeetCode ↗
              </a>
            </div>
          </div>
        )}

        {/* Summary stat cards */}
        {!loading && users.filter((u) => !u.error).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in">
            <StatCard
              label="Coders"
              value={users.filter((u) => !u.error).length}
              sub="on leaderboard"
            />
            <StatCard
              label="Problems Solved"
              value={totalSolvedAll.toLocaleString()}
              sub="combined"
            />
            <StatCard label="Avg Solved" value={avgSolved} sub="per coder" />
            <StatCard
              label="Top Rating"
              value={topRating > 0 ? topRating : "—"}
              sub="contest rating"
            />
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div
            className="flex gap-2 p-1.5 rounded-2xl border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "var(--bu-border)",
            }}
          >
            <button
              onClick={() => setViewMode("individuals")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "individuals" ? "shadow-lg scale-100" : "scale-95 opacity-60 hover:opacity-100"}`}
              style={{
                background:
                  viewMode === "individuals" ? "var(--bu-red)" : "transparent",
                color: viewMode === "individuals" ? "#fff" : "var(--bu-sub)",
              }}
            >
              👤 Individuals
            </button>
            <button
              onClick={() => setViewMode("batches")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "batches" ? "shadow-lg scale-100" : "scale-95 opacity-60 hover:opacity-100"}`}
              style={{
                background:
                  viewMode === "batches" ? "var(--bu-red)" : "transparent",
                color: viewMode === "batches" ? "#fff" : "var(--bu-sub)",
              }}
            >
              ⚔️ Batch Wars
            </button>
          </div>
        </div>

        {viewMode === "individuals" ? (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Search by name or username…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--bu-card)",
                  border: "1px solid var(--bu-border)",
                  color: "var(--bu-text)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--bu-red)")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--bu-border)")
                }
              />
              <div className="flex gap-2">
                {(["all", "top10", "contested"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background:
                        filter === f ? "var(--bu-red)" : "var(--bu-card)",
                      color: filter === f ? "#fff" : "var(--bu-sub)",
                      border: "1px solid",
                      borderColor:
                        filter === f ? "var(--bu-red)" : "var(--bu-border)",
                    }}
                  >
                    {f === "all"
                      ? "All"
                      : f === "top10"
                        ? "Top 10"
                        : "Contestants"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div
                className="rounded-xl px-6 py-4 mb-6 text-sm"
                style={{
                  background: "rgba(255,55,95,0.1)",
                  border: "1px solid rgba(255,55,95,0.3)",
                  color: "#ff375f",
                }}
              >
                {error}
              </div>
            )}

            {/* Table */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: "var(--bu-border)",
                background: "var(--bu-card)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="border-b text-left"
                      style={{
                        borderColor: "var(--bu-border)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <th
                        className="px-6 py-4 font-medium w-16"
                        style={{ color: "var(--bu-sub)" }}
                      >
                        Rank
                      </th>
                      <th
                        className="px-6 py-4 font-medium"
                        style={{ color: "var(--bu-sub)" }}
                      >
                        Coder
                      </th>
                      <th
                        className="px-6 py-4 font-medium cursor-pointer select-none hover:text-white transition-colors"
                        style={{ color: "var(--bu-sub)" }}
                        onClick={() => handleSort("yearStudying" as SortKey)}
                      >
                        Batch <SortIcon col={"yearStudying" as SortKey} />
                      </th>
                      <th
                        className="px-6 py-4 font-medium cursor-pointer select-none hover:text-white transition-colors"
                        style={{ color: "var(--bu-sub)" }}
                        onClick={() => handleSort("totalSolved")}
                      >
                        Solved <SortIcon col="totalSolved" />
                      </th>
                      <th
                        className="px-6 py-4 font-medium"
                        style={{ color: "var(--bu-sub)" }}
                      >
                        E / M / H
                      </th>
                      <th
                        className="px-6 py-4 font-medium cursor-pointer select-none hover:text-white transition-colors"
                        style={{ color: "var(--bu-sub)" }}
                        onClick={() => handleSort("contestRating")}
                      >
                        Contest <SortIcon col="contestRating" />
                      </th>
                      <th
                        className="px-6 py-4 font-medium cursor-pointer select-none hover:text-white transition-colors"
                        style={{ color: "var(--bu-sub)" }}
                        onClick={() => handleSort("ranking")}
                      >
                        Global Rank <SortIcon col="ranking" />
                      </th>

                      <th
                        className="px-6 py-4 font-medium"
                        style={{ color: "var(--bu-sub)" }}
                      >
                        Badges
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows count={6} />
                    ) : processed.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-4xl">🏆</span>
                            <p className="font-medium text-white">
                              {search ? "No results found" : "No coders yet"}
                            </p>
                            <p
                              className="text-sm"
                              style={{ color: "var(--bu-sub)" }}
                            >
                              {search
                                ? "Try a different search"
                                : "Be the first to join the leaderboard!"}
                            </p>
                            {!search && (
                              <button
                                onClick={() => setShowModal(true)}
                                className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                                style={{ background: "var(--bu-red)" }}
                              >
                                + Join Now
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processed.map((user, i) => (
                        <tr
                          key={user.username}
                          className="border-b row-glow transition-all duration-150 animate-fade-in"
                          style={{
                            borderColor: "var(--bu-border)",

                            animationDelay: `${i * 30}ms`,

                            cursor: "pointer",
                          }}
                          onClick={() => setSelectedUser({ user, rank: i + 1 })}
                        >
                          {/* Rank */}
                          <td className="px-6 py-4 w-16">
                            {getRankDisplay(i + 1)}
                          </td>

                          {/* User */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={user.username}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                  unoptimized
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ background: "var(--bu-red)" }}
                                >
                                  {user.username[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/user/${user.username}`}
                                    className="font-medium text-white hover:underline transition-colors font-mono text-sm"
                                  >
                                    {user.username}
                                  </Link>
                                  {firstBlood === user.username && (
                                    <span
                                      title="First Blood (Question of the Week)"
                                      className="text-base cursor-help drop-shadow-md"
                                    >
                                      🩸
                                    </span>
                                  )}
                                </div>
                                {user.realName &&
                                  user.realName !== user.username && (
                                    <p
                                      className="text-xs"
                                      style={{ color: "var(--bu-sub)" }}
                                    >
                                      {user.realName}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </td>

                          {/* Year studying */}
                          <td className="px-6 py-4">
                            <span
                              className="font-mono text-sm"
                              style={{ color: "var(--bu-sub)" }}
                            >
                              {user.yearStudying || "—"}
                            </span>
                          </td>

                          {/* Total solved */}
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-white text-base">
                              {user.totalSolved}
                            </span>
                          </td>

                          {/* Easy / Medium / Hard */}
                          <td className="px-6 py-4">
                            <div className="flex gap-3 font-mono text-sm">
                              <span className="easy">{user.easySolved}</span>
                              <span className="medium">
                                {user.mediumSolved}
                              </span>
                              <span className="hard">{user.hardSolved}</span>
                            </div>
                          </td>

                          {/* Contest rating */}
                          <td className="px-6 py-4">
                            {user.contestRating > 0 ? (
                              <div>
                                <span className="font-mono font-semibold text-white">
                                  {user.contestRating}
                                </span>
                                <span
                                  className="text-xs ml-1"
                                  style={{ color: "var(--bu-sub)" }}
                                >
                                  ({user.attendedContestsCount} contests)
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--bu-muted)" }}>
                                —
                              </span>
                            )}
                          </td>

                          {/* Global rank */}

                          <td className="px-6 py-4">
                            <span
                              className="font-mono text-sm"
                              style={{ color: "var(--bu-sub)" }}
                            >
                              #{user.ranking?.toLocaleString() ?? "—"}
                            </span>
                          </td>

                          {/* Badges */}

                          <td className="px-6 py-4">
                            <BadgeList
                              badges={computeBadges(user)}
                              variant="compact"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              {!loading && processed.length > 0 && (
                <div
                  className="px-6 py-3 border-t text-xs flex justify-between items-center"
                  style={{
                    borderColor: "var(--bu-border)",
                    color: "var(--bu-sub)",
                    background: "rgba(255,255,255,0.01)",
                  }}
                >
                  <span>
                    Showing {processed.length} of{" "}
                    {users.filter((u) => !u.error).length} coders
                  </span>
                  <span>
                    Data via{" "}
                    <a
                      href="https://leetcode.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      LeetCode
                    </a>{" "}
                    · Refreshes every 5 min
                  </span>
                </div>
              )}
            </div>

            {/* Failed users notice */}
            {users.some((u) => u.error) && (
              <p
                className="mt-4 text-xs text-center"
                style={{ color: "var(--bu-sub)" }}
              >
                {users.filter((u) => u.error).length} username(s) could not be
                fetched and are hidden.
              </p>
            )}
          </>
        ) : (
          /* Batch Wars View */
          <div className="animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {batchStats.map((batch, idx) => (
                <div
                  key={batch.year}
                  className="relative rounded-2xl p-6 border overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    background: "var(--bu-card)",
                    borderColor:
                      idx === 0 ? "var(--bu-red)" : "var(--bu-border)",
                  }}
                >
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {batch.year === "Unknown"
                          ? "Unassigned"
                          : `Batch ${batch.year}`}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--bu-sub)" }}>
                        {batch.totalStudents} coders
                      </p>
                    </div>
                    {idx === 0 && (
                      <span
                        className="text-4xl filter drop-shadow-lg"
                        title="Current Leader"
                      >
                        👑
                      </span>
                    )}
                    {idx === 1 && (
                      <span className="text-4xl filter drop-shadow-lg opacity-80">
                        🥈
                      </span>
                    )}
                    {idx === 2 && (
                      <span className="text-4xl filter drop-shadow-lg opacity-60">
                        🥉
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        background: "var(--bu-dark)",
                        borderColor: "var(--bu-border)",
                      }}
                    >
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: "var(--bu-sub)" }}
                      >
                        Average Solved
                      </p>
                      <p className="text-3xl font-mono font-bold text-white">
                        {batch.avgSolved.toLocaleString()}{" "}
                        <span className="text-sm font-sans font-normal opacity-50">
                          / coder
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <div
                        className="flex-1 p-3 rounded-xl border text-center"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "var(--bu-border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1 font-medium"
                          style={{ color: "#00b8a3" }}
                        >
                          Easy
                        </p>
                        <p className="font-mono text-sm text-white">
                          {batch.totalEasy.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className="flex-1 p-3 rounded-xl border text-center"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "var(--bu-border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1 font-medium"
                          style={{ color: "#ffc01e" }}
                        >
                          Med
                        </p>
                        <p className="font-mono text-sm text-white">
                          {batch.totalMedium.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className="flex-1 p-3 rounded-xl border text-center"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "var(--bu-border)",
                        }}
                      >
                        <p
                          className="text-xs mb-1 font-medium"
                          style={{ color: "#ff375f" }}
                        >
                          Hard
                        </p>
                        <p className="font-mono text-sm text-white">
                          {batch.totalHard.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar representing their portion of total solved */}
                  <div className="mt-6 h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(5, (batch.avgSolved / (batchStats[0]?.avgSolved || 1)) * 100)}%`,
                        background:
                          idx === 0
                            ? "linear-gradient(90deg, #ff6b6b, var(--bu-red))"
                            : "var(--bu-sub)",
                      }}
                    />
                  </div>
                </div>
              ))}

              {batchStats.length === 0 && (
                <div
                  className="col-span-full py-20 text-center border rounded-2xl"
                  style={{
                    borderColor: "var(--bu-border)",
                    background: "var(--bu-card)",
                  }}
                >
                  <p className="text-white font-medium">
                    No batch data available yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add user modal */}

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchLeaderboard}
        />
      )}

      {selectedUser && (
        <UserProfileModal
          user={selectedUser.user}
          collegeRank={selectedUser.rank}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
