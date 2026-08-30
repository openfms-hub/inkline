import { NextResponse } from "next/server";
import { readImageFile } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: { id: string; shotId: string } }
) {
  const buf = readImageFile(params.id, params.shotId);
  if (!buf) return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" }
  });
}
