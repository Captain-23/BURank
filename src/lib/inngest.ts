import { Inngest } from "inngest";
import { refreshLeaderboard } from "./refresh";

export const inngest = new Inngest({ id: "burank" });

export const refreshLeaderboardFunction = inngest.createFunction(
  {
    id: "refresh-leaderboard",
    triggers: { cron: "*/15 * * * *" },
  },
  async () => refreshLeaderboard(),
);
