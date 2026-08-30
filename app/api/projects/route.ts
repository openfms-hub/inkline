import { NextRequest, NextResponse } from "next/server";
import { listProjects, saveProject, Project } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "标题和正文都不能为空" }, { status: 400 });
  }
  const project: Project = {
    id: crypto.randomUUID(),
    title: body.title,
    content: body.content,
    createdAt: new Date().toISOString(),
    status: "draft",
    shots: [],
    voiceover: []
  };
  saveProject(project);
  return NextResponse.json(project);
}
