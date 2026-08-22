import { NextResponse } from "next/server";
import { requestFromThisSite, siteOnlyResponse } from "@/lib/server/origin";
import { isAuthedRequest } from "@/lib/server/request-auth";
import { loadTrainingState, saveTrainingState } from "@/lib/server/training-store";
import type { CacheBundle } from "@/lib/types";

export async function GET(request: Request) {
  if (!requestFromThisSite(request)) return siteOnlyResponse();
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }
  const state = await loadTrainingState();
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  if (!requestFromThisSite(request)) return siteOnlyResponse();
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as CacheBundle | null;
  if (!body?.athlete) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    const saved = await saveTrainingState(body);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write rejected";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
