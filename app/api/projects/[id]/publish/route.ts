import { NextRequest, NextResponse } from "next/server";
import { getProject, getSettings, saveProject, PublishPack } from "@/lib/store";
import { callLLM, parseJsonBlock } from "@/lib/llm";
import { buildPublishPrompt } from "@/lib/prompts";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  if (!project.voiceover.length)
    return NextResponse.json({ error: "请先生成旁白" }, { status: 400 });
  try {
    const settings = getSettings();
    const raw = await callLLM(settings, buildPublishPrompt(project));
    const parsed = parseJsonBlock<PublishPack>(raw);
    project.publish = {
      titles: parsed.titles || [],
      body: parsed.body || "",
      tags: parsed.tags || { core: [], scene: [], mood: [] },
      comment: parsed.comment || ""
    };
    project.status = "package";
    saveProject(project);
    return NextResponse.json(project);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
