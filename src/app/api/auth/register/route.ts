import { NextRequest, NextResponse } from "next/server";
import { fetchLeetCodeUser } from "@/lib/leetcode";
import { addUsernameToSheet, fetchUsernamesFromSheet } from "@/lib/sheets";
import { createSessionCookie, hashPassword } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username: string = (body.username ?? "").trim().toLowerCase();
    const yearStudying: string = (body.yearStudying ?? "").trim();
    const enrollmentNo: string = (body.enrollmentNo ?? "").trim().toUpperCase();
    const password: string = (body.password ?? "").trim();

    if (!username || username.length < 2) {
      return NextResponse.json({ success: false, message: "Invalid username." }, { status: 400 });
    }
    if (!yearStudying) {
      return NextResponse.json({ success: false, message: "Year of study is required." }, { status: 400 });
    }
    if (!enrollmentNo) {
      return NextResponse.json({ success: false, message: "Enrollment number is required." }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ success: false, message: "Password must be at least 4 characters." }, { status: 400 });
    }

    // 1. Check for duplicates
    const existing = await fetchUsernamesFromSheet();
    if (existing.some((e) => e.username === username)) {
      return NextResponse.json({
        success: false,
        message: "This LeetCode username is already registered.",
      });
    }

    if (existing.some((e) => e.enrollmentNo === enrollmentNo)) {
      return NextResponse.json({
        success: false,
        message: "This Enrollment Number has already been registered.",
      });
    }

    // 2. Validate that the LeetCode user actually exists
    const user = await fetchLeetCodeUser(username);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: `LeetCode user "${username}" not found. Check your username and try again.`,
      });
    }

    // 3. Write to sheet with hashed password
    const hashedPassword = hashPassword(password);
    const result = await addUsernameToSheet(username, yearStudying, enrollmentNo, hashedPassword);
    
    if (result.success) {
      createSessionCookie(username);
    }
    
    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/auth/register error:", err);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
