import { NextResponse } from "next/server";
import { clearProject, getUserFromSession, getDoc, doc, db } from "@/lib/demo-store"; // Need to export getDoc, doc, db from demo-store or skip. Wait, clearProject deletes logs and conflicts for a project.
// Actually, I can just update clearProject to take organization or just check it here.

const COOKIE_NAME = "founder_session";

export async function POST(request) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const user = await getUserFromSession(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const projectId = body.projectId;

    await clearProject(projectId, user.organization);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    const msg = error?.message || String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
