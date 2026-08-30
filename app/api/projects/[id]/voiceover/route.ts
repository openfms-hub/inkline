import { NextRequest, NextResponse } from "next/server";
import { getProject, getSettings, saveProject } from "@/lib/store";
import { callLLM, parseJsonBlock } from "@/lib/llm";
import { buildVoiceoverPrompt } from "@/lib/prompts";
import { shotContentKey } from "@/lib/presets";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  if (!project.shots.length)
    return NextResponse.json({ error: "请先生成 Shot List" }, { status: 400 });
  try {
    const settings = getSettings();
    const raw = await callLLM(settings, buildVoiceoverPrompt(project));
    const parsed = parseJsonBlock<{ lines: { shotId: string; text: string }[]; tips?: string }>(raw);
    project.voiceover = parsed.lines || [];
    project.voiceoverTips = parsed.tips || "";
    for (const line of project.voiceover) {
      const shot = project.shots.find((s) => s.id === line.shotId);
      if (shot) shot.voiceoverSnapshot = shotContentKey(shot);
    }
    if (project.status === "images" || project.status === "voiceover") {
      project.status = "voiceover";
    }
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
  if (Array.isArray(body.voiceover)) {
    project.voiceover = body.voiceover;
    saveProject(project);
  }
  return NextResponse.json(project);
}
