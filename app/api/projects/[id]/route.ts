import { NextRequest, NextResponse } from "next/server";
import { deleteProject, getProject, saveProject } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  const body = await req.json();
  if (body.styleId) project.styleId = body.styleId;
  if (body.ipId) project.ipId = body.ipId;
  if (typeof body.title === "string" && body.title.trim()) project.title = body.title.trim();
  if (typeof body.content === "string" && body.content.trim()) project.content = body.content;
  saveProject(project);
  return NextResponse.json(project);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  deleteProject(params.id);
  return NextResponse.json({ ok: true });
}
