"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { LeetCodeUser } from "@/types";
import { computeBadges } from "@/lib/badges";
import BestBadgeTag from "./BestBadgeTag";

export default function LeaderboardTable({ users }: { users: LeetCodeUser[] }) {
  const router = useRouter();
  return (
    <div className="board">
      <div className="list-scroll">
        <div className="rows">
          <div className="rows-head">
            <div></div><div>Coder</div><div>Badges</div><div>Batch</div>
            <div className="r">Solved</div><div>E / M / H</div><div>Contest</div>
            <div className="r">Global</div><div></div><div></div>
          </div>

          {users.map((u, i) => {
            const rank = i + 1;
            const g = rank <= 3 ? ` g${rank}` : "";
            const badges = computeBadges(u).slice(0, 2);
            return (
              <div key={u.username} className={`row${g}`} onClick={() => router.push(`/user/${u.username}`)}>
                <div className="inner">
                  <div className="rk">{rank}</div>
                  <div>
                    <div className="coder">
                      {u.avatar ? (
                        <Image className="ava2" src={u.avatar} alt={u.username} width={40} height={40} unoptimized style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="ava2">{u.username[0]?.toUpperCase()}</div>
                      )}
                      <div>
                        <div className="nm">{u.realName || u.username}</div>
                        <div className="un">@{u.username}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="badges">
                      {badges.map((b) => (
                        <span key={b.id} className="bdg grind">{b.label}</span>
                      ))}
                    </div>
                  </div>
                  <div><span className="batch-tag">{u.yearStudying || "—"}</span></div>
                  <div className="r num-cell">{u.totalSolved}</div>
                  <div>
                    <span className="emh">
                      <span className="e">{u.easySolved}</span> <span className="m">{u.mediumSolved}</span> <span className="h">{u.hardSolved}</span>
                    </span>
                  </div>
                  <div className="contest-cell">
                    {u.contestRating > 0 ? (<><b>{u.contestRating}</b> <span>({u.attendedContestsCount})</span></>) : <b>—</b>}
                  </div>
                  <div className="r sub-cell">#{u.ranking?.toLocaleString() ?? "—"}</div>
                  <div><BestBadgeTag user={u} /></div>
                  <div className="acts"><span className="chev">›</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
