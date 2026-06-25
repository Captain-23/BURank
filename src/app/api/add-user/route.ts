import { NextRequest, NextResponse } from "next/server";

// This endpoint is deprecated — registration now lives at /api/auth/register
// Kept for backwards compatibility.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const registerUrl = url.origin + "/api/auth/register";
  const body = await req.text();
  const res = await fetch(registerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
