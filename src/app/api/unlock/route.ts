import { NextResponse } from "next/server";
import { requestFromThisSite, siteOnlyResponse } from "@/lib/server/origin";
import { passphraseMatches } from "@/lib/server/secrets";
import { sessionCookieOptions } from "@/lib/server/request-auth";
import { loadTrainingState } from "@/lib/server/training-store";

const attempts = new Map<string, { count: number; resetAt: number }>();

function allowAttempt(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  current.count += 1;
  return current.count <= 8;
}

export async function POST(request: Request) {
  if (!requestFromThisSite(request)) return siteOnlyResponse();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowAttempt(ip)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    passphrase?: string;
  } | null;
  if (!body?.passphrase || !passphraseMatches(body.passphrase)) {
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }

  const state = await loadTrainingState();
  const response = NextResponse.json({ ok: true, ...state });
  const cookie = sessionCookieOptions();
  response.cookies.set(cookie);
  return response;
}
