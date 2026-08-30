import { NextRequest, NextResponse } from "next/server";
import { getProject, getSettings, saveProject, Shot } from "@/lib/store";
import { callLLM, parseJsonBlock } from "@/lib/llm";
import { buildShotListPrompt } from "@/lib/prompts";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  try {
    const settings = getSettings();
    const raw = await callLLM(settings, buildShotListPrompt(project, settings));
    const parsed = parseJsonBlock<{ shots: Omit<Shot, "id" | "imageStatus">[] }>(raw);
    project.shots = (parsed.shots || []).map((s) => ({
      ...s,
      labels: s.labels || [],
      elements: s.elements || [],
      id: crypto.randomUUID(),
      imageStatus: "idle"
    }));
    project.status = "shots";
    saveProject(project);
    return NextResponse.json(project);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  const body = await req.json();
  if (Array.isArray(body.shots)) {
    project.shots = body.shots;
    saveProject(project);
  }
  return NextResponse.json(project);
}
