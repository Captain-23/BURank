import { refreshLeaderboard } from "../src/lib/refresh";

refreshLeaderboard().catch((error) => {
  console.error(error);
  process.exit(1);
});
