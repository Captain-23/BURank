export interface LeetCodeUser {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  acceptanceRate: number;
  contestRating: number;
  contestGlobalRanking: number;
  attendedContestsCount: number;
  topPercentage: number;
  avatar: string;
  realName: string;
  addedAt?: string;
  yearStudying?: string;
  enrollmentNo?: string;
  error?: boolean;
  recentSubmissions?: { titleSlug: string; timestamp: string }[];
  firstBlood?: boolean;
}

export interface SheetEntry {
  username: string;
  addedAt: string;
  yearStudying: string;
  enrollmentNo: string;
  password?: string;
}

export type SortKey =
  | "totalSolved"
  | "ranking"
  | "contestRating"
  | "hardSolved"
  | "yearStudying";

export type SortDirection = "asc" | "desc";
