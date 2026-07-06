import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { deleteUserFromSheet } from "@/lib/sheets";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-session";

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
      const username = String(body.username).toLowerCase();
      const success = await deleteUserFromSheet(username);
      // Remove from the cache immediately so the leaderboard updates now.
      await prisma.userStat.deleteMany({ where: { username } });
      revalidateTag("leaderboard");
      return NextResponse.json({
        success,
        message: success ? "User deleted" : "Failed to delete user",
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
