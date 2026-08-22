import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requestFromThisSite } from "@/lib/server/origin";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  if (!requestFromThisSite(request)) {
    return NextResponse.json(
      { error: "This API only accepts this website." },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
