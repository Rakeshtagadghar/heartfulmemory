const rateLimitStore = new Map<string, number[]>();

export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

export type RateLimitState = {
  limited: boolean;
  retryAfterMs: number;
  remaining: number;
};

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitState {
  const now = Date.now();
  const previous = rateLimitStore.get(key) || [];
  const recent = previous.filter((timestamp) => now - timestamp < config.windowMs);

  if (recent.length >= config.max) {
    const oldestRecent = recent[0] ?? now;
    return {
      limited: true,
      retryAfterMs: Math.max(0, config.windowMs - (now - oldestRecent)),
      remaining: 0
    };
  }

  recent.push(now);
  rateLimitStore.set(key, recent);

  return {
    limited: false,
    retryAfterMs: 0,
    remaining: Math.max(0, config.max - recent.length)
  };
}

export function clearRateLimitStore() {
  rateLimitStore.clear();
}