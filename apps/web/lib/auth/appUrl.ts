export function getBaseAppUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);
      return parsed.origin;
    } catch {
      // fall through to request URL.
    }
  }

  return new URL(request.url).origin;
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
