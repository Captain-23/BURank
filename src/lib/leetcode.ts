import { LeetCodeUser } from "@/types";

const LEETCODE_API = "https://leetcode.com/graphql";

const USER_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    attendedContestsCount
    topPercentage
  }
  recentAcSubmissionList(username: $username, limit: 15) {
    titleSlug
    timestamp
  }
}
`;

interface GraphQLResponse {
  data?: {
    matchedUser?: {
      username: string;
      profile: {
        realName: string;
        userAvatar: string;
        ranking: number;
      };
      submitStats: {
        acSubmissionNum: Array<{ difficulty: string; count: number }>;
      };
    };
    userContestRanking?: {
      rating: number;
      globalRanking: number;
      attendedContestsCount: number;
      topPercentage: number;
    };
    recentAcSubmissionList?: Array<{ titleSlug: string; timestamp: string }>;
  };
  errors?: Array<{ message: string }>;
}

export async function fetchLeetCodeUser(
  username: string
): Promise<LeetCodeUser | null> {
  try {
    const res = await fetch(LEETCODE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({
        query: USER_QUERY,
        variables: { username },
      }),
      next: { revalidate: 300 }, // Cache 5 min in Next.js
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json: GraphQLResponse = await res.json();

    if (json.errors || !json.data?.matchedUser) return null;

    const user = json.data.matchedUser;
    const contest = json.data.userContestRanking;
    const stats = user.submitStats.acSubmissionNum;

    const getCount = (difficulty: string) =>
      stats.find((s) => s.difficulty === difficulty)?.count ?? 0;

    return {
      username: user.username,
      realName: user.profile.realName || user.username,
      avatar: user.profile.userAvatar,
      ranking: user.profile.ranking ?? 0,
      totalSolved: getCount("All"),
      easySolved: getCount("Easy"),
      mediumSolved: getCount("Medium"),
      hardSolved: getCount("Hard"),
      acceptanceRate: 0, // not in this query; skip to avoid extra call
      contestRating: contest ? Math.round(contest.rating) : 0,
      contestGlobalRanking: contest?.globalRanking ?? 0,
      attendedContestsCount: contest?.attendedContestsCount ?? 0,
      topPercentage: contest?.topPercentage ?? 100,
      recentSubmissions: json.data.recentAcSubmissionList ?? [],
    };
  } catch {
    return null;
  }
}

export async function validateUsername(username: string): Promise<boolean> {
  const user = await fetchLeetCodeUser(username);
  return user !== null;
}

const CALENDAR_QUERY = `
query userProfileCalendar($username: String!) {
  matchedUser(username: $username) {
    userCalendar {
      submissionCalendar
    }
  }
}
`;

export async function fetchLeetCodeCalendar(username: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(LEETCODE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({
        query: CALENDAR_QUERY,
        variables: { username },
      }),
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (json.errors || !json.data?.matchedUser?.userCalendar?.submissionCalendar) return null;

    return JSON.parse(json.data.matchedUser.userCalendar.submissionCalendar);
  } catch {
    return null;
  }
}
