import { NextResponse } from "next/server";
import { ingestLog } from "@/lib/demo-store";

export async function POST(req) {
  try {
    const body = await req.json();
    const { founder, content, projectId, userId } = body;
    const result = await ingestLog({ founder, content, projectId, userId });
    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Error:", error);
    const msg = error?.message || String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
