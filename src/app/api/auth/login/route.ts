import { NextRequest, NextResponse } from "next/server";
import { fetchUsernamesFromSheet } from "@/lib/sheets";
import { createSessionCookie, hashPassword } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username: string = (body.username ?? "").trim().toLowerCase();
    const password: string = (body.password ?? "").trim();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username and password required." }, { status: 400 });
    }

    const existing = await fetchUsernamesFromSheet();
    const user = existing.find((e) => e.username === username);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const hashedPassword = hashPassword(password);
    
    // Check if the password matches. If the user was added before passwords existed, 
    // we might need a fallback or they need to re-register. For now, strict match.
    if (!user.password || user.password !== hashedPassword) {
      return NextResponse.json({ success: false, message: "Incorrect password." }, { status: 401 });
    }

    createSessionCookie(username);
    return NextResponse.json({ success: true, message: "Logged in successfully." });
  } catch (err) {
    console.error("/api/auth/login error:", err);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
