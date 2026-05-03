import { NextResponse } from "next/server";
import { ingestLog, getUserFromSession } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function POST(req) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = await getUserFromSession(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content, projectId } = body;
    const result = await ingestLog({
      name: user.name,
      role: user.role,
      organization: user.organization,
      content,
      projectId,
      userId: user.id
    });
    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Error:", error);
    const msg = error?.message || String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
