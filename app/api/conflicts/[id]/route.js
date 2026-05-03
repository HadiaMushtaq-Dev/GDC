import { NextResponse } from "next/server";
import { resolveConflict, getUserFromSession } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function PATCH(req, { params }) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = await getUserFromSession(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const conflict = await resolveConflict(id, user.organization);
    if (!conflict) {
      return NextResponse.json({ error: "Conflict not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, conflict });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
