import { NextResponse } from "next/server";
import { removeSession } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function POST(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  await removeSession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}
