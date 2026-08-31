import { NextResponse } from "next/server";
import { requestFromThisSite, siteOnlyResponse } from "@/lib/server/origin";
import { isAuthedRequest } from "@/lib/server/request-auth";
import { loadSessionById } from "@/lib/server/training-store";

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
