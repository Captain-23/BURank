import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { deleteUserFromSheet } from "@/lib/sheets";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-session";
import { suppressUsername } from "@/lib/suppressed-users-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session");
    if (!verifyAdminToken(session?.value)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "delete") {
      if (!body.username) {
        return NextResponse.json({ success: false, message: "Username required" }, { status: 400 });
      }
      const username = String(body.username).trim().toLowerCase();
      const sheetResult = await deleteUserFromSheet(username);
      const { count } = await prisma.userStat.deleteMany({
        where: { username: { equals: username, mode: "insensitive" } },
      });

      const removedFromCache = count > 0;
      const removedFromSheet = sheetResult.success;

      if (removedFromSheet || removedFromCache) {
        // Block ingest/refresh from resurrecting this user if the published
        // sheet CSV is still stale.
        await suppressUsername(username);
        revalidateTag("leaderboard");
        revalidatePath("/");
        revalidatePath("/admin");

        let message = "User deleted.";
        if (removedFromCache && !removedFromSheet) {
          message =
            "User removed from the leaderboard. Could not remove them from the roster sheet, but they will stay hidden until they register again.";
        } else if (removedFromSheet && !removedFromCache) {
          message = "User removed from roster sheet (was not in cache).";
        }
        return NextResponse.json({ success: true, message });
      }

      return NextResponse.json({
        success: false,
        message: sheetResult.message || "User not found.",
      });
    }

    if (body.action === "set_qotw") {
      const qotwUrl = String(body.qotw_url || "");
      const now = new Date().toISOString();
      await prisma.$transaction([
        prisma.setting.upsert({
          where: { key: "qotw_url" },
          update: { value: qotwUrl },
          create: { key: "qotw_url", value: qotwUrl },
        }),
        prisma.setting.upsert({
          where: { key: "qotw_timestamp" },
          update: { value: now },
          create: { key: "qotw_timestamp", value: now },
        }),
        // New QOTW resets first blood; the next cron run recomputes it.
        prisma.setting.upsert({
          where: { key: "first_blood" },
          update: { value: "" },
          create: { key: "first_blood", value: "" },
        }),
      ]);
      revalidateTag("settings");
      return NextResponse.json({ success: true, message: "QOTW updated" });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Admin Action Error]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
