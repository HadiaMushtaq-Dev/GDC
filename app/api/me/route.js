import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function GET(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = await getUserFromSession(token);
  return NextResponse.json({ user });
}
