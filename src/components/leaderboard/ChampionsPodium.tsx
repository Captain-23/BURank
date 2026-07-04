import { LeetCodeUser } from "@/types";
import ChampionCard from "./ChampionCard";

export default function ChampionsPodium({ top }: { top: LeetCodeUser[] }) {
  if (top.length < 3) return null;
  return (
    <div className="hero">
      <div className="ghost">Champions</div>
      <div className="podium">
        <ChampionCard user={top[0]} place={1} />
        <ChampionCard user={top[1]} place={2} />
        <ChampionCard user={top[2]} place={3} />
      </div>
    </div>
  );
}
