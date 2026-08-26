import { prisma } from "@/lib/prisma";
import {
  ACTIVITY_RETENTION_MS,
  normalizeDifficulty,
  type ActivityPayload,
  type ProblemMeta,
} from "@/lib/activity";

const CHUNK = 80;

export async function persistProblems(problems: ProblemMeta[]): Promise<number> {
  const ops = problems
    .map((problem) => {
      const titleSlug = problem.titleSlug?.trim();
      if (!titleSlug) return null;
      const data = {
        title: problem.title.trim() || titleSlug,
        frontendId: String(problem.frontendId ?? "").trim(),
        difficulty: normalizeDifficulty(problem.difficulty),
      };
      return prisma.problem.upsert({
        where: { titleSlug },
        create: { titleSlug, ...data },
        update: data,
      });
    })
    .filter((op): op is NonNullable<typeof op> => op !== null);

  for (let i = 0; i < ops.length; i += CHUNK) {
    await prisma.$transaction(ops.slice(i, i + CHUNK));
  }
  return ops.length;
}

export async function persistActivities(
  events: ActivityPayload[],
): Promise<number> {
  const ops = events
    .map((event) => {
      const username = event.username.trim().toLowerCase();
      const titleSlug = event.titleSlug?.trim();
      const solvedAt = new Date(event.solvedAt);
      if (!username || !titleSlug || Number.isNaN(solvedAt.getTime())) {
        return null;
      }
      const data = {
        realName: event.realName.trim() || username,
        avatar: event.avatar.trim(),
        title: event.title.trim() || titleSlug,
        frontendId: String(event.frontendId ?? "").trim(),
        difficulty: normalizeDifficulty(event.difficulty),
      };
      return prisma.activityEvent.upsert({
        where: {
          username_titleSlug_solvedAt: { username, titleSlug, solvedAt },
        },
        create: { username, titleSlug, solvedAt, ...data },
        update: data,
      });
    })
    .filter((op): op is NonNullable<typeof op> => op !== null);

  for (let i = 0; i < ops.length; i += CHUNK) {
    await prisma.$transaction(ops.slice(i, i + CHUNK));
  }
  return ops.length;
}

export async function pruneOldActivities(): Promise<void> {
  await prisma.activityEvent.deleteMany({
    where: {
      solvedAt: { lt: new Date(Date.now() - ACTIVITY_RETENTION_MS) },
    },
  });
}
