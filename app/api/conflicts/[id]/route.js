import { NextResponse } from "next/server";
import { resolveConflict } from "@/lib/demo-store";

export async function PATCH(_req, { params }) {
  try {
    const { id } = await params;
    const conflict = await resolveConflict(id);
    if (!conflict) {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, conflict });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
