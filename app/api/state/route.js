import { NextResponse } from "next/server";
import { listProjectState, getUserFromSession } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function GET(req) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = await getUserFromSession(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ logs: [], conflicts: [] });
    }

    const state = await listProjectState(projectId, user.organization);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
