import { NextResponse } from "next/server";
import { authenticateUser, createSession, registerUser } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || "login";

    let user;
    if (action === "signup") {
      user = await registerUser(body);
      return NextResponse.json({ success: true, user });
    } else if (action === "login") {
      user = await authenticateUser(body);
      const token = await createSession(user.id);
      const response = NextResponse.json({ success: true, user });
      response.cookies.set({ name: COOKIE_NAME, value: token, httpOnly: true, sameSite: "lax", path: "/" });
      return response;
    } else {
      return NextResponse.json({ error: "Unknown auth action" }, { status: 400 });
    }
  } catch (error) {
    const message = error?.code === "email-already-in-use"
      ? "This email is already registered."
      : error?.code === "invalid-credential"
        ? "Invalid email or password."
        : error?.message || String(error);
    return NextResponse.json({ error: message, code: error?.code }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}
