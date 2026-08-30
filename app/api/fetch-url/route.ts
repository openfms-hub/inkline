import { NextRequest, NextResponse } from "next/server";
import { fetchArticle } from "@/lib/fetchArticle";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = (body.url || "").trim();
  if (!url) return NextResponse.json({ error: "请填写网址" }, { status: 400 });
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "网址格式不正确" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "只支持 http/https 网址" }, { status: 400 });
  }
  try {
    const article = await fetchArticle(parsed.toString());
    return NextResponse.json(article);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
