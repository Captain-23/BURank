import { NextRequest, NextResponse } from "next/server";
import { deleteUserFromSheet, setQuestionOfTheWeek } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[Admin Action]", body);
    
    if (body.action === "delete") {
      if (!body.username) return NextResponse.json({ success: false, message: "Username required" }, { status: 400 });
      const success = await deleteUserFromSheet(body.username);
      console.log("[Admin Delete]", body.username, "result:", success);
      return NextResponse.json({ success, message: success ? "User deleted" : "Failed to delete user" });
    }
    
    if (body.action === "set_qotw") {
      const success = await setQuestionOfTheWeek(body.qotw_url || "");
      console.log("[Admin QOTW]", body.qotw_url, "result:", success);
      return NextResponse.json({ success, message: success ? "QOTW updated" : "Failed to update QOTW" });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Admin Action Error]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
