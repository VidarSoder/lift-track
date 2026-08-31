import { NextResponse } from "next/server";
import { requestFromThisSite, siteOnlyResponse } from "@/lib/server/origin";
import { isAuthedRequest } from "@/lib/server/request-auth";
import { listSessionSummaries } from "@/lib/server/training-store";

export async function GET(request: Request) {
  if (!requestFromThisSite(request)) return siteOnlyResponse();
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }
  const url = new URL(request.url);
  const kindParam = url.searchParams.get("kind")?.trim() ?? "all";
  const kind =
    kindParam === "training" || kindParam === "stretch" || kindParam === "all"
      ? kindParam
      : "all";
  const limit = Number(url.searchParams.get("limit") ?? "12");
  const cursor = url.searchParams.get("cursor");
  const page = await listSessionSummaries({
    kind,
    limit: Number.isFinite(limit) ? limit : 12,
    cursor,
  });
  return NextResponse.json(page);
}
