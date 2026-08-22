import { cookies } from "next/headers";
import { sessionToken, sessionTokenMatches } from "@/lib/server/secrets";

export const SESSION_COOKIE = "training_session";

export async function isAuthedRequest() {
  const jar = await cookies();
  return sessionTokenMatches(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: sessionToken(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
