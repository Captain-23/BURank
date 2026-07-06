interface SubmissionUser {
  username: string;
  recentSubmissions?: { titleSlug: string; timestamp: string }[];
}

/**
 * Returns the username of the earliest person to solve the QOTW problem
 * at or after `qotwTimestamp`, or null if none / inputs missing.
 * Pure and dependency-free so it can be unit-tested and run outside Next.js.
 */
export function computeFirstBlood(
  users: SubmissionUser[],
  qotwUrl: string,
  qotwTimestamp: string,
): string | null {
  if (!qotwUrl || !qotwTimestamp) return null;

  const match = qotwUrl.match(/problems\/([^/]+)/);
  const titleSlug = match ? match[1] : null;
  if (!titleSlug) return null;

  const qotwTime = new Date(qotwTimestamp).getTime() / 1000;
  if (Number.isNaN(qotwTime)) return null;

  let earliestSolver: string | null = null;
  let earliestTime = Infinity;

  for (const user of users) {
    if (!user.recentSubmissions) continue;
    for (const submission of user.recentSubmissions) {
      if (submission.titleSlug !== titleSlug) continue;
      const t = parseInt(submission.timestamp, 10);
      if (t >= qotwTime && t < earliestTime) {
        earliestTime = t;
        earliestSolver = user.username;
      }
    }
  }

  return earliestSolver;
}
