import Image from "next/image";
import Link from "next/link";
import { LeetCodeUser } from "@/types";
import BestBadgeTag from "./BestBadgeTag";

const PLACE = ["", "1", "2", "3"];
const SUP = ["", "st", "nd", "rd"];
const BAND = ["", "c1", "c2", "c3"];

export default function ChampionCard({ user, place }: { user: LeetCodeUser; place: 1 | 2 | 3 }) {
  return (
    <article className={`champ ${BAND[place]}`}>
      <div className="band">
        <div className="place">{PLACE[place]}<sup>{SUP[place]}</sup></div>
      </div>
      <div className="avatar-wrap">
        <div className="avatar">
          {user.avatar ? (
            <Image className="avatar-in" src={user.avatar} alt={user.username} width={100} height={88} unoptimized style={{ objectFit: "cover" }} />
          ) : (
            <div className="avatar-in" />
          )}
        </div>
      </div>
      <div className="badge-row"><BestBadgeTag user={user} /></div>
      <div className="body">
        <div className="name-row"><h3>{user.realName || user.username}</h3></div>
        <p className="role">@{user.username}</p>
        <div className="stats">
          <div className="stat"><div className="v">{user.totalSolved}</div><div className="k">Solved</div></div>
          <div className="stat"><div className="v">{user.contestRating > 0 ? user.contestRating : "—"}</div><div className="k">Contest</div></div>
          <div className="stat">
            <div className="emh">
              <span className="e">{user.easySolved}</span> <span className="d">·</span>{" "}
              <span className="m">{user.mediumSolved}</span> <span className="d">·</span>{" "}
              <span className="h">{user.hardSolved}</span>
            </div>
            <div className="k">E · M · H</div>
          </div>
        </div>
        <Link href={`/user/${user.username}`} className="profile-btn" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
          Profile
        </Link>
      </div>
    </article>
  );
}
