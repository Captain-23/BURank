import { SheetEntry } from "@/types";
import { parseRosterCsv } from "./roster";
import { normalizeEnrollmentNo } from "./enrollment";

const SHEET_CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL ?? "";
// Server-only write endpoint. Prefer the non-public var so the Apps Script URL
// is never shipped to the browser; fall back to the legacy public name so
// existing deployments keep working until the env var is renamed.
const SHEET_WRITE_URL =
  process.env.SHEET_WRITE_URL ?? process.env.NEXT_PUBLIC_SHEET_WRITE_URL ?? "";
// Optional shared secret; when set it must match the Apps Script's SHEET_WRITE_SECRET.
const SHEET_WRITE_SECRET = process.env.SHEET_WRITE_SECRET ?? "";

const GAS_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function parseGasJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function readGasResponse(res: Response): Promise<Record<string, unknown> | null> {
  return parseGasJson(await res.text());
}

/**
 * Helper to POST to Google Apps Script and handle its redirect correctly.
 * GAS returns a 302 redirect; the redirect target only accepts GET.
 * We stop the redirect, grab the Location URL (which contains the response),
 * and follow it with GET.
 */
async function postToGAS(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  if (!SHEET_WRITE_URL) return null;

  try {
    const res = await fetch(SHEET_WRITE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, secret: SHEET_WRITE_SECRET }),
      redirect: "manual", // Don't auto-follow the 302
    });

    if (GAS_REDIRECT_STATUSES.has(res.status)) {
      const location = res.headers.get("location");
      if (!location) return null;
      const redirectUrl = new URL(location, SHEET_WRITE_URL).toString();
      const followRes = await fetch(redirectUrl, { method: "GET" });
      return readGasResponse(followRes);
    }

    return readGasResponse(res);
  } catch (err) {
    console.error("[postToGAS] Error:", err);
    return null;
  }
}

/**
 * Reads all usernames from the published Google Sheet CSV.
 * The sheet must have columns: username, addedAt
 */
export async function fetchUsernamesFromSheet(): Promise<SheetEntry[]> {
  if (!SHEET_CSV_URL) {
    console.warn("NEXT_PUBLIC_SHEET_CSV_URL not set");
    return [];
  }

  try {
    const res = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    return parseRosterCsv(await res.text());
  } catch (err) {
    console.error("fetchUsernamesFromSheet error:", err);
    return [];
  }
}

/**
 * Writes a new username to the sheet via Google Apps Script web app.
 * The Apps Script must be deployed as a web app with "Anyone" access.
 */
export async function addUsernameToSheet(
  username: string,
  email: string,
  yearStudying: string,
  enrollmentNo: string,
): Promise<{ success: boolean; message: string }> {
  if (!SHEET_WRITE_URL) {
    return { success: false, message: "Sheet write URL not configured." };
  }

  try {
    const data = await postToGAS({
      action: "add",
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      addedAt: new Date().toISOString(),
      yearStudying,
      enrollmentNo: normalizeEnrollmentNo(enrollmentNo),
    });

    if (!data) return { success: false, message: "No response from sheet." };

    if (data.status === "duplicate") {
      return {
        success: false,
        message:
          (data.message as string) ||
          "This username is already on the leaderboard.",
      };
    }

    if (data.status === "success") {
      return { success: true, message: "Added to leaderboard!" };
    }

    return {
      success: false,
      message: (data.message as string) ?? "Unknown error.",
    };
  } catch (err) {
    console.error("addUsernameToSheet error:", err);
    return { success: false, message: "Failed to connect to sheet." };
  }
}

export async function deleteUserFromSheet(
  username: string,
): Promise<{ success: boolean; message: string }> {
  if (!SHEET_WRITE_URL) {
    return { success: false, message: "Sheet write URL not configured." };
  }

  const data = await postToGAS({ action: "delete", username });
  if (!data) {
    return { success: false, message: "No response from sheet." };
  }
  if (data.status === "success") {
    return { success: true, message: "User deleted from roster." };
  }
  return {
    success: false,
    message: (data.message as string) ?? "Failed to delete user from roster.",
  };
}

