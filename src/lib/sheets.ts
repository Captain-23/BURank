import { SheetEntry } from "@/types";

const SHEET_CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL ?? "";
const SHEET_WRITE_URL = process.env.NEXT_PUBLIC_SHEET_WRITE_URL ?? "";

/**
 * Helper to POST to Google Apps Script and handle its redirect correctly.
 * GAS returns a 302 redirect; the redirect target only accepts GET.
 * We stop the redirect, grab the Location URL (which contains the response),
 * and follow it with GET.
 */
async function postToGAS(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (!SHEET_WRITE_URL) return null;

  try {
    const res = await fetch(SHEET_WRITE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual", // Don't auto-follow the 302
    });

    // GAS returns 302 with Location header pointing to the response
    if (res.status === 302 || res.status === 301) {
      const redirectUrl = res.headers.get("location");
      if (redirectUrl) {
        const followRes = await fetch(redirectUrl, { method: "GET" });
        const text = await followRes.text();
        try {
          return JSON.parse(text);
        } catch {
          // Try to extract JSON from potential HTML wrapper
          const match = text.match(/\{[^}]+\}/);
          if (match) return JSON.parse(match[0]);
        }
      }
      return null;
    }

    // If no redirect (shouldn't happen normally, but handle it)
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[^}]+\}/);
      if (match) return JSON.parse(match[0]);
      return null;
    }
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
    const res = await fetch(
      `${SHEET_CSV_URL}&cachebust=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);

    const csv = await res.text();
    const lines = csv.trim().split("\n").slice(1); // skip header row

    return lines
      .map((line) => {
        const [username, addedAt, yearStudying, enrollmentNo] = line.split(",").map((v) => v.trim());
        return { 
          username: username?.toLowerCase(), 
          addedAt: addedAt ?? "",
          yearStudying: yearStudying ?? "",
          enrollmentNo: enrollmentNo ?? ""
        };
      })
      .filter((e) => e.username && e.username.length > 0);
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
  yearStudying: string,
  enrollmentNo: string
): Promise<{ success: boolean; message: string }> {
  if (!SHEET_WRITE_URL) {
    return { success: false, message: "Sheet write URL not configured." };
  }

  try {
    const data = await postToGAS({
      action: "add",
      username: username.toLowerCase().trim(),
      addedAt: new Date().toISOString(),
      yearStudying,
      enrollmentNo
    });

    if (!data) return { success: false, message: "No response from sheet." };

    if (data.status === "duplicate") {
      return {
        success: false,
        message: data.message as string || "This username is already on the leaderboard.",
      };
    }

    if (data.status === "success") {
      return { success: true, message: "Added to leaderboard!" };
    }

    return { success: false, message: (data.message as string) ?? "Unknown error." };
  } catch (err) {
    console.error("addUsernameToSheet error:", err);
    return { success: false, message: "Failed to connect to sheet." };
  }
}

export async function deleteUserFromSheet(username: string): Promise<boolean> {
  console.log("[deleteUser] Sending delete request for:", username);
  const data = await postToGAS({ action: "delete", username });
  console.log("[deleteUser] Response:", data);
  return data?.status === "success";
}

export async function setQuestionOfTheWeek(qotw_url: string): Promise<boolean> {
  console.log("[setQOTW] Setting:", qotw_url);
  const data = await postToGAS({ action: "set_qotw", qotw_url });
  console.log("[setQOTW] Response:", data);
  return data?.status === "success";
}

export async function getQuestionOfTheWeek(): Promise<string> {
  if (!SHEET_WRITE_URL) return "";
  try {
    // GET requests to GAS also redirect, handle the same way
    const res = await fetch(`${SHEET_WRITE_URL}?action=get_qotw`, {
      cache: "no-store",
      redirect: "manual",
    });
    
    if (res.status === 302 || res.status === 301) {
      const redirectUrl = res.headers.get("location");
      if (redirectUrl) {
        const followRes = await fetch(redirectUrl, { method: "GET" });
        const text = await followRes.text();
        try {
          const data = JSON.parse(text);
          return data.qotw_url || "";
        } catch {
          return "";
        }
      }
      return "";
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.qotw_url || "";
    } catch {
      return "";
    }
  } catch {
    return "";
  }
}

