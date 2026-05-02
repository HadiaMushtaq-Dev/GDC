import { NextResponse } from "next/server";
import { clearProject } from "@/lib/demo-store";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body.projectId;

    await clearProject(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    const msg = error?.message || String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
