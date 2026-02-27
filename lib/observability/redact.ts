const MAX_STRING_LENGTH = 280;
const MAX_DEPTH = 4;
const REDACTED = "[REDACTED]";

const SENSITIVE_KEY_PARTS = [
  "token",
  "secret",
  "password",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "email",
  "transcript",
  "story",
  "narrative",
  "prompt",
  "answertext",
  "requestbody",
  "body",
  "raw",
  "content"
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksSensitiveKey(key: string) {
  const normalized = key.toLowerCase().replaceAll(/[\W_]+/g, "");
  return SENSITIVE_KEY_PARTS.some((part) =>
    normalized.includes(part.replaceAll(/[\W_]+/g, ""))
  );
}

export function clampString(value: string, maxLength = MAX_STRING_LENGTH) {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function sanitizeString(value: string) {
  const clamped = clampString(value);
  return EMAIL_PATTERN.test(clamped) ? REDACTED : clamped;
}

function redactAtDepth(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return "[Truncated]";
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => redactAtDepth(item, depth + 1));
  if (!isRecord(value)) return undefined;

  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (looksSensitiveKey(key)) {
      next[key] = REDACTED;
      continue;
    }
    next[key] = redactAtDepth(entry, depth + 1);
  }
  return next;
}

export function redactUnknown(value: unknown): unknown {
  return redactAtDepth(value, 0);
}

export function sanitizeErrorMessage(message: string) {
  return clampString(message.replaceAll(/\s+/g, " "), 420);
}

export function sanitizeUrlQuery(url: string, allowedKeys: string[] = ["chapter", "page", "mode"]) {
  const allow = new Set(allowedKeys);
  const base = "https://local.invalid";
  let parsed: URL;
  try {
    parsed = new URL(url, base);
  } catch {
    return clampString(url, 240);
  }

  const query = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    query.set(key, allow.has(key) ? clampString(value, 120) : REDACTED);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return `${parsed.pathname}${suffix}`;
}
