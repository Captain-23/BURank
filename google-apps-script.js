/**
 * Bennett University LeetCode Leaderboard
 * Google Apps Script — paste this into script.google.com
 *
 * Setup:
 *  1. Open your Google Sheet
 *  2. Go to Extensions → Apps Script
 *  3. Paste this entire file and save (Ctrl+S)
 *  4. Click Deploy → New Deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Copy the Web App URL → paste into .env.local as NEXT_PUBLIC_SHEET_WRITE_URL
 */

const SHEET_NAME = "users"; // Name of the sheet tab

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || "add"; // add, delete, set_qotw

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "set_qotw") {
      let settingsSheet = ss.getSheetByName("settings");
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet("settings");
      }
      // Store QotW in A1
      settingsSheet.getRange(1, 1).setValue(body.qotw_url || "");
      return jsonResponse({ status: "success", message: "QOTW updated." });
    }

    const username = (body.username || "").trim().toLowerCase();
    
    if (!username) {
      return jsonResponse({ status: "error", message: "No username provided." });
    }

    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, 4).setValues([["username", "addedAt", "yearStudying", "enrollmentNo"]]);
    }

    if (action === "delete") {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).toLowerCase() === username) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ status: "success", message: "User deleted." });
        }
      }
      return jsonResponse({ status: "error", message: "User not found." });
    }

    // Default 'add' logic below
    const addedAt = body.addedAt || new Date().toISOString();
    const yearStudying = body.yearStudying || "";
    const enrollmentNo = (body.enrollmentNo || "").trim().toUpperCase();

    // Check for duplicates
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === username) {
        return jsonResponse({ status: "duplicate", message: "LeetCode username already exists." });
      }
      if (data[i][3] && String(data[i][3]).toUpperCase() === enrollmentNo) {
        return jsonResponse({ status: "duplicate", message: "Enrollment number already registered." });
      }
    }

    // Append new row
    sheet.appendRow([username, addedAt, yearStudying, enrollmentNo]);
    return jsonResponse({ status: "success", message: "Added successfully." });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (e && e.parameter && e.parameter.action === "get_qotw") {
    let settingsSheet = ss.getSheetByName("settings");
    if (!settingsSheet) return jsonResponse({ qotw_url: "" });
    const val = settingsSheet.getRange(1, 1).getValue();
    return jsonResponse({ qotw_url: val || "" });
  }

  return jsonResponse({ status: "ok", message: "BU LeetCode Sheet API running." });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
