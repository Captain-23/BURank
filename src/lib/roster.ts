import type { SheetEntry } from "@/types";

/**
 * Parses the published Google Sheet CSV into roster entries.
 * Expected columns: username, email, addedAt, yearStudying, enrollmentNo
 * (a trailing `password` column, if present, is ignored).
 * Pure and dependency-free so it can be unit-tested and run outside Next.js.
 */
export function parseRosterCsv(csv: string): SheetEntry[] {
  const lines = csv.trim().split("\n").slice(1); // drop header
  return lines
    .map((line) => {
      const [username, email, addedAt, yearStudying, enrollmentNo] = line
        .split(",")
        .map((v) => v.trim());
      return {
        username: username?.toLowerCase() ?? "",
        email: email?.toLowerCase() ?? "",
        addedAt: addedAt ?? "",
        yearStudying: yearStudying ?? "",
        enrollmentNo: enrollmentNo ?? "",
      };
    })
    .filter((e) => e.username && e.username.length > 0);
}
