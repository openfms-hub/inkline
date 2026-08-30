import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const current = getSettings();
  const next = {
    llm: { ...current.llm, ...body.llm },
    image: { ...current.image, ...body.image },
    styleId: body.styleId ?? current.styleId,
    styleDna: body.styleDna ?? current.styleDna,
    ips: Array.isArray(body.ips) && body.ips.length ? body.ips : current.ips,
    activeIpId: body.activeIpId ?? current.activeIpId
  };
  saveSettings(next);
  return NextResponse.json(next);
}
