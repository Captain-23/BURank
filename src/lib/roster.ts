import type { SheetEntry } from "@/types";
import { normalizeEnrollmentNo } from "./enrollment";

/** Parse one CSV row, respecting double-quoted fields. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields.map((field) => field.replace(/^"|"$/g, "").trim());
}

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
      const [username, email, addedAt, yearStudying, enrollmentNo] =
        parseCsvLine(line);
      return {
        username: username?.toLowerCase() ?? "",
        email: email?.toLowerCase() ?? "",
        addedAt: addedAt ?? "",
        yearStudying: yearStudying ?? "",
        enrollmentNo: enrollmentNo ? normalizeEnrollmentNo(enrollmentNo) : "",
      };
    })
    .filter((e) => e.username && e.username.length > 0);
}
