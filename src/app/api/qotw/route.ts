import { NextResponse } from "next/server";
import { getQuestionOfTheWeek } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const qotw_url = await getQuestionOfTheWeek();
    return NextResponse.json({ qotw_url });
  } catch (err) {
    return NextResponse.json({ qotw_url: "" });
  }
}
