import { NextResponse } from "next/server";
import { getQuestionOfTheWeek } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const qotw = await getQuestionOfTheWeek();
    return NextResponse.json(qotw);
  } catch (err) {
    return NextResponse.json({ qotw_url: "", qotw_timestamp: "", first_blood: "" });
  }
}
