import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  isPlausibleEnrollmentNo,
  normalizeEnrollmentNo,
} from "@/lib/enrollment";
import type { SheetEntry } from "@/types";

/** Write roster enrollment into Postgres when the cache row is missing it. */
export async function backfillEnrollmentIfMissing(
  username: string,
  enrollmentNo: string,
): Promise<boolean> {
  const normalized = normalizeEnrollmentNo(enrollmentNo);
  if (!isPlausibleEnrollmentNo(normalized)) return false;

  const row = await prisma.userStat.findUnique({
    where: { username: username.toLowerCase() },
    select: { enrollmentNo: true },
  });
  if (!row) return false;
  if (row.enrollmentNo && isPlausibleEnrollmentNo(row.enrollmentNo)) {
    return false;
  }

  await prisma.userStat.update({
    where: { username: username.toLowerCase() },
    data: { enrollmentNo: normalized },
  });
  revalidateTag("leaderboard");
  return true;
}

type RankedUser = {
  username: string;
  enrollmentNo: string | null;
};

/** Find a leaderboard row by enrollment, falling back to the sheet roster. */
export function findRankedUserByEnrollment(
  rows: RankedUser[],
  roster: SheetEntry[],
  enrollment: string,
): { idx: number; enrollmentNo: string } | null {
  const normalized = normalizeEnrollmentNo(enrollment);
  if (!isPlausibleEnrollmentNo(normalized)) return null;

  const directIdx = rows.findIndex(
    (r) => r.enrollmentNo && enrollmentMatchesSafe(r.enrollmentNo, normalized),
  );
  if (directIdx !== -1) {
    return { idx: directIdx, enrollmentNo: normalized };
  }

  const rosterEntry = roster.find(
    (e) =>
      e.enrollmentNo &&
      enrollmentMatchesSafe(e.enrollmentNo, normalized),
  );
  if (!rosterEntry) return null;

  const idx = rows.findIndex((r) => r.username === rosterEntry.username);
  if (idx === -1) return null;

  return { idx, enrollmentNo: normalized };
}

function enrollmentMatchesSafe(a: string, b: string): boolean {
  return normalizeEnrollmentNo(a) === b;
}
