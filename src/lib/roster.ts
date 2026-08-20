import type { SheetEntry } from "@/types";
import {
  isPlausibleEnrollmentNo,
  normalizeEnrollmentNo,
} from "./enrollment";

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

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikeDate(value: string): boolean {
  const v = value.trim();
  return (
    /^\d{4}-\d{2}-\d{2}/.test(v) ||
    /^\d{4}-\d{2}-\d{2}T/.test(v) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)
  );
}

function enrollmentFromRaw(value: string): string {
  if (!value?.trim()) return "";
  const normalized = normalizeEnrollmentNo(value);
  return isPlausibleEnrollmentNo(normalized) ? normalized : "";
}

/** Legacy sheet layout: username, addedAt, yearStudying, enrollmentNo [, password] */
function isLegacyRow(fields: string[]): boolean {
  const second = (fields[1] ?? "").trim();
  if (!second) return false;
  return looksLikeDate(second) && !looksLikeEmail(second);
}

function parseLegacyRow(fields: string[]): SheetEntry {
  const username = (fields[0] ?? "").toLowerCase().trim();
  return {
    username,
    email: "",
    addedAt: fields[1] ?? "",
    yearStudying: fields[2] ?? "",
    enrollmentNo: enrollmentFromRaw(fields[3] ?? ""),
  };
}

function fieldAt(
  fields: string[],
  headerIndex: Map<string, number>,
  name: string,
): string {
  const idx = headerIndex.get(name);
  return idx !== undefined ? (fields[idx] ?? "").trim() : "";
}

function parseModernRow(
  fields: string[],
  headerIndex: Map<string, number>,
): SheetEntry {
  const username = fieldAt(fields, headerIndex, "username").toLowerCase();
  const enrollmentRaw =
    fieldAt(fields, headerIndex, "enrollmentno") || (fields[4] ?? "");

  return {
    username,
    email: fieldAt(fields, headerIndex, "email").toLowerCase(),
    addedAt: fieldAt(fields, headerIndex, "addedat"),
    yearStudying: fieldAt(fields, headerIndex, "yearstudying"),
    enrollmentNo: enrollmentFromRaw(enrollmentRaw),
  };
}

function parseRosterRow(
  fields: string[],
  headerIndex: Map<string, number>,
): SheetEntry | null {
  const username = (fields[0] ?? "").toLowerCase().trim();
  if (!username) return null;

  if (isLegacyRow(fields)) {
    return parseLegacyRow(fields);
  }

  return parseModernRow(fields, headerIndex);
}

/**
 * Parses the published Google Sheet CSV into roster entries.
 * Supports the current header layout and legacy rows that predate the email
 * column (or still store addedAt in the email column).
 */
export function parseRosterCsv(csv: string): SheetEntry[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map(normalizeHeader);
  const headerIndex = new Map<string, number>();
  header.forEach((name, idx) => headerIndex.set(name, idx));

  return lines
    .slice(1)
    .map((line) => parseRosterRow(parseCsvLine(line), headerIndex))
    .filter((entry): entry is SheetEntry => !!entry?.username);
}
