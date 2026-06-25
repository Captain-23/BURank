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
      // Store QotW URL in A1, timestamp in B1, clear first_blood in C1
      settingsSheet.getRange(1, 1).setValue(body.qotw_url || "");
      settingsSheet.getRange(1, 2).setValue(new Date().toISOString());
      settingsSheet.getRange(1, 3).setValue(""); // Clear first blood
      return jsonResponse({ status: "success", message: "QOTW updated." });
    }

    if (action === "set_first_blood") {
      let settingsSheet = ss.getSheetByName("settings");
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet("settings");
      }
      // Store first_blood username in C1
      settingsSheet.getRange(1, 3).setValue(body.first_blood || "");
      return jsonResponse({ status: "success", message: "First blood updated." });
    }

    const username = (body.username || "").trim().toLowerCase();
    
    if (!username) {
      return jsonResponse({ status: "error", message: "No username provided." });
    }

    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, 5).setValues([["username", "addedAt", "yearStudying", "enrollmentNo", "password"]]);
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
    const password = body.password || "";

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
    sheet.appendRow([username, addedAt, yearStudying, enrollmentNo, password]);
    return jsonResponse({ status: "success", message: "Added successfully." });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (e && e.parameter && e.parameter.action === "get_qotw") {
    let settingsSheet = ss.getSheetByName("settings");
    if (!settingsSheet) return jsonResponse({ qotw_url: "", qotw_timestamp: "", first_blood: "" });
    const url = settingsSheet.getRange(1, 1).getValue();
    const timestamp = settingsSheet.getRange(1, 2).getValue();
    const first_blood = settingsSheet.getRange(1, 3).getValue();
    return jsonResponse({ 
      qotw_url: url || "", 
      qotw_timestamp: timestamp || "", 
      first_blood: first_blood || "" 
    });
  }

  return jsonResponse({ status: "ok", message: "BU LeetCode Sheet API running." });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
