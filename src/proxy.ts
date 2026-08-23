import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requestFromThisSite, siteOnlyResponse } from "@/lib/server/origin";

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  if (!requestFromThisSite(request)) {
    return siteOnlyResponse();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
