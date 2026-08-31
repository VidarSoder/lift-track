import { NextResponse } from "next/server";
import { requestFromThisSite, siteOnlyResponse } from "@/lib/server/origin";
import { isAuthedRequest } from "@/lib/server/request-auth";
import {
  loadSessionById,
  patchSessionDuration,
} from "@/lib/server/training-store";

export async function GET(request: Request) {
  if (!requestFromThisSite(request)) return siteOnlyResponse();
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id || id.length > 160) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }
  const session = await loadSessionById(id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function PATCH(request: Request) {
  if (!requestFromThisSite(request)) return siteOnlyResponse();
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }
  let body: { id?: string; durationMin?: number };
  try {
    body = (await request.json()) as { id?: string; durationMin?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = body.id?.trim() ?? "";
  if (!id || id.length > 160) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }
  try {
    const result = await patchSessionDuration(id, Number(body.durationMin));
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
