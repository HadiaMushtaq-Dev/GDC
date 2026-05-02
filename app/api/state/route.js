import { NextResponse } from "next/server";
import { listProjectState } from "@/lib/demo-store";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ logs: [], conflicts: [] });
    }

    const state = await listProjectState(projectId);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
