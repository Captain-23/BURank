import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminToken } from "@/lib/admin-session";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD env variable is not set");
      return NextResponse.json({ success: false, message: "Admin not configured" }, { status: 500 });
    }

    if (typeof password !== "string" || !safeEqual(password, adminPassword)) {
      return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });
    }

    const token = createAdminToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Admin not configured" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
