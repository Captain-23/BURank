import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const username = getUserFromSession();
  if (!username) {
    return NextResponse.json({ authenticated: false, username: null });
  }
  return NextResponse.json({ authenticated: true, username });
}
