import Image from "next/image";
import { LeetCodeUser } from "@/types";
import { computeHighlights } from "@/lib/highlights";

function Card({ label, name, value, dotColor, dot, avatar }: {
  label: string; name: string; value: React.ReactNode; dotColor: string; dot: string; avatar?: string;
}) {
  return (
    <div className="hl">
      <div className="ava">
        {avatar ? (
          <Image className="ava-img" src={avatar} alt={name} width={42} height={42} unoptimized />
        ) : null}
        <div className="dot" style={{ background: dotColor }}>{dot}</div>
      </div>
      <div className="txt"><div className="lab">{label}</div><div className="who">{name}</div></div>
      <div className="num">{value}</div>
    </div>
  );
}

export default function HighlightCards({ users, firstBlood }: { users: LeetCodeUser[]; firstBlood: string }) {
  const h = computeHighlights(users, firstBlood);
  const nm = (u: LeetCodeUser | null) => (u ? u.realName || u.username : "—");
  return (
    <div className="highlights">
      <Card label="Most Solved" name={nm(h.mostSolved)} value={h.mostSolved?.totalSolved ?? "—"} dotColor="var(--red)" dot="▲" avatar={h.mostSolved?.avatar} />
      <Card label="Top Contest Rating" name={nm(h.topRating)} value={h.topRating?.contestRating ?? "—"} dotColor="#3B7DD8" dot="★" avatar={h.topRating?.avatar} />
      <Card label="Most Hard Solved" name={nm(h.mostHard)} value={h.mostHard?.hardSolved ?? "—"} dotColor="var(--hard)" dot="◆" avatar={h.mostHard?.avatar} />
      <Card label="First Blood · QOTW" name={nm(h.firstBlood)} value={h.firstBlood ? "🔥" : "—"} dotColor="#12A594" dot="🩸" avatar={h.firstBlood?.avatar} />
    </div>
  );
}
