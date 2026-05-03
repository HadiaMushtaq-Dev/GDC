import { NextResponse } from "next/server";
import { createProject, deleteProject, listProjects, updateProject, getUserFromSession } from "@/lib/demo-store";

const COOKIE_NAME = "founder_session";

export async function GET(req) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = await getUserFromSession(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await listProjects(user.organization);
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("Projects GET error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = await getUserFromSession(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action = "create", name, projectId } = body;

    if (action === "create") {
      if (!name) return NextResponse.json({ error: "Missing project name" }, { status: 400 });
      const project = await createProject(name, user.organization);
      return NextResponse.json({ success: true, projectId: project.id, project });
    }

    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    if (action === "close") {
      await updateProject(projectId, { status: "closed" });
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      await deleteProject(projectId, user.organization);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Projects POST error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
