import { NextRequest, NextResponse } from "next/server";
import { fetchLeetCodeUser } from "@/lib/leetcode";
import { addUsernameToSheet, fetchUsernamesFromSheet } from "@/lib/sheets";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in before joining the leaderboard.",
        },
        { status: 401 },
      );
    }
    const body = await req.json();
    const username: string = (body.username ?? "").trim().toLowerCase();
    const yearStudying: string = (body.yearStudying ?? "").trim();
    const enrollmentNo: string = (body.enrollmentNo ?? "").trim().toUpperCase();

    if (!username || username.length < 2) {
      return NextResponse.json(
        { success: false, message: "Invalid username." },
        { status: 400 },
      );
    }
    if (!yearStudying) {
      return NextResponse.json(
        { success: false, message: "Year of study is required." },
        { status: 400 },
      );
    }
    if (!enrollmentNo) {
      return NextResponse.json(
        { success: false, message: "Enrollment number is required." },
        { status: 400 },
      );
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

    if (existing.some((e) => e.email === email)) {
      return NextResponse.json({
        success: false,
        message: "This email has already joined the leaderboard.",
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

    const result = await addUsernameToSheet(
      username,
      email!,
      yearStudying,
      enrollmentNo,
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/auth/register error:", err);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
