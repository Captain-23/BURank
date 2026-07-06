import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Run on-demand (never prerendered at build); the DB read is Data-Cached.
export const dynamic = "force-dynamic";

// Cached read, dropped on revalidateTag("settings") (admin set_qotw / cron ingest).
const getSettings = unstable_cache(
  async () =>
    prisma.setting.findMany({
      where: { key: { in: ["qotw_url", "qotw_timestamp", "first_blood"] } },
    }),
  ["qotw-settings"],
  { tags: ["settings"], revalidate: 300 },
);

export async function GET() {
  try {
    const rows = await getSettings();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      qotw_url: map.qotw_url ?? "",
      qotw_timestamp: map.qotw_timestamp ?? "",
      first_blood: map.first_blood ?? "",
    });
  } catch {
    return NextResponse.json({
      qotw_url: "",
      qotw_timestamp: "",
      first_blood: "",
    });
  }
}
