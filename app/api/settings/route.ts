import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const current = getSettings();
  const next = {
    llm: { ...current.llm, ...body.llm },
    image: { ...current.image, ...body.image },
    styleDna: body.styleDna ?? current.styleDna
  };
  saveSettings(next);
  return NextResponse.json(next);
}
