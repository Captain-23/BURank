import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const problems = await prisma.problem.findMany();
    return NextResponse.json(
      { problems },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("/api/problems error:", err);
    return NextResponse.json(
      { problems: [] },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
