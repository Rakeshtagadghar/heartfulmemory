type RateLimitBucket = {
  count: number;
  resetAtMs: number;
};

type ExportRateLimitConfig = {
  enabled: boolean;
  maxExportsPerWindow: number;
  windowMs: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getConfig(): ExportRateLimitConfig {
  const enabledRaw = (process.env.EXPORT_RATE_LIMIT_ENABLED ?? "true").trim().toLowerCase();
  const enabled = enabledRaw !== "0" && enabledRaw !== "false" && enabledRaw !== "no";
  const maxExportsPerWindow = Number.parseInt(process.env.EXPORT_RATE_LIMIT_MAX ?? "10", 10);
  const windowMs = Number.parseInt(process.env.EXPORT_RATE_LIMIT_WINDOW_MS ?? `${5 * 60 * 1000}`, 10);
  return {
    enabled,
    maxExportsPerWindow: Number.isFinite(maxExportsPerWindow) && maxExportsPerWindow > 0 ? maxExportsPerWindow : 10,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 5 * 60 * 1000
  };
}

export function checkExportRateLimit(userId: string) {
  const config = getConfig();
  if (!config.enabled) {
    return { ok: true as const, limit: config.maxExportsPerWindow, remaining: config.maxExportsPerWindow };
  }

  const now = Date.now();
  const key = `export:${userId}`;
  const current = buckets.get(key);
  if (!current || current.resetAtMs <= now) {
    buckets.set(key, { count: 1, resetAtMs: now + config.windowMs });
    return {
      ok: true as const,
      limit: config.maxExportsPerWindow,
      remaining: config.maxExportsPerWindow - 1,
      resetAtMs: now + config.windowMs
    };
  }

  if (current.count >= config.maxExportsPerWindow) {
    return {
      ok: false as const,
      limit: config.maxExportsPerWindow,
      remaining: 0,
      resetAtMs: current.resetAtMs,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAtMs - now) / 1000))
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    ok: true as const,
    limit: config.maxExportsPerWindow,
    remaining: config.maxExportsPerWindow - current.count,
    resetAtMs: current.resetAtMs
  };
}
