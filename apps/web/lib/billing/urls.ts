export function resolveAbsoluteUrl(input: {
  requestUrl: string;
  value: string | null | undefined;
  fallbackPath: string;
}) {
  const request = new URL(input.requestUrl);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `${request.protocol}//${request.host}`;
  const fallback = new URL(input.fallbackPath, base);
  const raw = (input.value ?? "").trim();
  if (!raw) return fallback.toString();

  try {
    const parsed = new URL(raw, base);
    if (parsed.origin !== fallback.origin) return fallback.toString();
    return parsed.toString();
  } catch {
    return fallback.toString();
  }
}

