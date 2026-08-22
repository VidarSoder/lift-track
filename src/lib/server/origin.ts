const LOCAL = new Set(["127.0.0.1", "localhost"]);

function extraOrigins() {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function allowedOrigins() {
  const origins = new Set([
    "https://training-eight-fawn.vercel.app",
    "http://127.0.0.1:43173",
    "http://localhost:43173",
    ...extraOrigins(),
  ]);
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return origins;
}

function hostnameAllowed(hostname: string) {
  if (LOCAL.has(hostname)) return true;
  if (hostname === "training-eight-fawn.vercel.app") return true;
  if (hostname.startsWith("training-") && hostname.endsWith(".vercel.app")) {
    return true;
  }
  for (const origin of extraOrigins()) {
    try {
      if (new URL(origin).hostname === hostname) return true;
    } catch {
      /* ignore */
    }
  }
  if (process.env.VERCEL_URL && hostname === process.env.VERCEL_URL) return true;
  if (
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    hostname === process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return true;
  }
  return false;
}

export function requestFromThisSite(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return hostnameAllowed(new URL(origin).hostname);
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return hostnameAllowed(new URL(referer).hostname);
    } catch {
      return false;
    }
  }
  const host = request.headers.get("host")?.split(":")[0];
  return host ? hostnameAllowed(host) : false;
}

export function siteOnlyResponse() {
  return Response.json({ error: "This API only accepts this website." }, { status: 403 });
}
