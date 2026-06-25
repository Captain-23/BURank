import { fetchLeetCodeUser, fetchLeetCodeCalendar } from "@/lib/leetcode";
import { fetchUsernamesFromSheet } from "@/lib/sheets";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Heatmap from "@/components/Heatmap";

interface Props {
  params: { username: string };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = params;

  // Fetch all required data
  const [user, calendar, sheetUsers] = await Promise.all([
    fetchLeetCodeUser(username),
    fetchLeetCodeCalendar(username),
    fetchUsernamesFromSheet()
  ]);

  if (!user) {
    notFound();
  }

  // Find their year of studying from the sheet
  const sheetEntry = sheetUsers.find(u => u.username === user.username);
  const yearStudying = sheetEntry?.yearStudying || "Not specified";

  return (
    <div className="min-h-screen" style={{ background: "var(--bu-dark)" }}>
      {/* Top gradient accent */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, var(--bu-red), #ff6b6b, var(--bu-red))" }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-slide-up">
        <Link 
          href="/" 
          className="text-sm font-medium mb-8 inline-flex items-center gap-2 transition-colors hover:text-white"
          style={{ color: "var(--bu-sub)" }}
        >
          <span>←</span> Back to Leaderboard
        </Link>

        {/* Profile Header Card */}
        <div 
          className="rounded-2xl p-8 mb-8 border flex flex-col md:flex-row items-center gap-6"
          style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username}
              width={100}
              height={100}
              className="rounded-2xl shadow-lg border border-white/10"
              unoptimized
            />
          ) : (
            <div
              className="w-[100px] h-[100px] rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg border border-white/10"
              style={{ background: "var(--bu-red)" }}
            >
              {user.username[0]?.toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight">{user.realName}</h1>
            <a 
              href={`https://leetcode.com/${user.username}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lg font-mono hover:underline"
              style={{ color: "var(--bu-sub)" }}
            >
              @{user.username}
            </a>
            
            <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(255, 55, 95, 0.1)", color: "var(--bu-red)", border: "1px solid rgba(255,55,95,0.2)" }}
              >
                Global Rank: #{user.ranking?.toLocaleString() || "—"}
              </span>
              {yearStudying && yearStudying !== "Not specified" && (
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Year Studying: {yearStudying}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-8 md:gap-4 text-center md:text-right">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--bu-sub)" }}>Contest Rating</p>
              <p className="text-2xl font-bold text-white">{user.contestRating > 0 ? user.contestRating : "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--bu-sub)" }}>Contests Attended</p>
              <p className="text-2xl font-bold text-white">{user.attendedContestsCount}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div 
            className="rounded-2xl p-6 border flex flex-col justify-center items-center md:items-start"
            style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--bu-sub)" }}>Total Solved</p>
            <p className="text-4xl font-bold text-white font-mono">{user.totalSolved}</p>
          </div>
          
          <div 
            className="rounded-2xl p-6 border flex flex-col justify-center items-center md:items-start md:col-span-3"
            style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}
          >
            <p className="text-sm font-medium mb-4" style={{ color: "var(--bu-sub)" }}>Difficulty Breakdown</p>
            <div className="w-full flex flex-col gap-3">
              {/* Easy */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium easy">Easy</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full" style={{ background: "#00b8a3", width: `${Math.max(2, (user.easySolved / Math.max(1, user.totalSolved)) * 100)}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-sm text-white">{user.easySolved}</span>
              </div>
              {/* Medium */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium medium">Medium</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full" style={{ background: "#ffc01e", width: `${Math.max(2, (user.mediumSolved / Math.max(1, user.totalSolved)) * 100)}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-sm text-white">{user.mediumSolved}</span>
              </div>
              {/* Hard */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium hard">Hard</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full" style={{ background: "#ff375f", width: `${Math.max(2, (user.hardSolved / Math.max(1, user.totalSolved)) * 100)}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-sm text-white">{user.hardSolved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Card */}
        <div 
          className="rounded-2xl p-6 border overflow-x-auto"
          style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Submission Calendar</h2>
            <p className="text-xs font-mono" style={{ color: "var(--bu-sub)" }}>Past 12 Months</p>
          </div>
          <div className="min-w-[700px]">
             {calendar ? (
               <Heatmap data={calendar} />
             ) : (
               <div className="h-32 flex items-center justify-center text-sm" style={{ color: "var(--bu-sub)" }}>
                 No activity data available.
               </div>
             )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
