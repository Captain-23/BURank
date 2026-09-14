import { serve } from "inngest/next";
import { inngest, refreshLeaderboardFunction } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [refreshLeaderboardFunction],
});