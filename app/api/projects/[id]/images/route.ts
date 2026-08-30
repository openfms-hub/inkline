import { NextRequest, NextResponse } from "next/server";
import { getProject, getSettings, saveProject, saveImage } from "@/lib/store";
import { generateImage } from "@/lib/images";
import { buildImagePrompt } from "@/lib/prompts";
import { resolveAspect, shotContentKey } from "@/lib/presets";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  const { shotId } = await req.json();
  const shot = project.shots.find((s) => s.id === shotId);
  if (!shot) return NextResponse.json({ error: "镜头不存在" }, { status: 404 });
  shot.imageStatus = "generating";
  shot.error = undefined;
  saveProject(project);
  try {
    const settings = getSettings();
    const prompt = buildImagePrompt(shot, settings, project);
    const b64 = await generateImage(settings, prompt, resolveAspect(project.aspectRatio).size);
    shot.imagePath = saveImage(project.id, shot.id, b64);
    shot.imageSnapshot = shotContentKey(shot);
    shot.imageStatus = "done";
    if (project.status === "shots") project.status = "images";
    saveProject(project);
    return NextResponse.json(project);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    shot.imageStatus = "error";
    shot.error = msg;
    saveProject(project);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
