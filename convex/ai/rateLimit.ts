const oneMinuteMs = 60 * 1000;
const requestsByUser = new Map<string, number[]>();

export function checkAndRecordAiRateLimit(subject: string, limitPerMinute: number) {
  if (limitPerMinute <= 0) {
    return { allowed: true as const, remaining: null as number | null };
  }

  const now = Date.now();
  const recent = (requestsByUser.get(subject) ?? []).filter((timestamp) => now - timestamp < oneMinuteMs);
  if (recent.length >= limitPerMinute) {
    requestsByUser.set(subject, recent);
    return { allowed: false as const, remaining: 0 };
  }

  recent.push(now);
  requestsByUser.set(subject, recent);
  return { allowed: true as const, remaining: Math.max(0, limitPerMinute - recent.length) };
}
