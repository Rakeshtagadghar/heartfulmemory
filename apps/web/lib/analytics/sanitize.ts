"use client";

import type { AnalyticsProps } from "./events";

const blockedExactKeys = new Set([
  "email",
  "name",
  "first_name",
  "last_name",
  "full_name",
  "phone",
  "address",
  "message",
  "prompt",
  "story",
  "story_text",
  "question",
  "answer",
  "content",
  "text"
]);

const allowedSafeSuffixes = [
  "_id",
  "_code",
  "_category",
  "_bucket",
  "_type",
  "_mode",
  "_source",
  "_status",
  "_step",
  "_method",
  "_provider",
  "_variant",
  "_plan"
];

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function hasSafeSuffix(key: string) {
  return allowedSafeSuffixes.some((suffix) => key.endsWith(suffix));
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function sanitizeAnalyticsProps(input: AnalyticsProps) {
  const sanitized: AnalyticsProps = {};
  const redactedKeys: string[] = [];

  for (const [key, rawValue] of Object.entries(input)) {
    if (rawValue === undefined) continue;

    const normalized = normalizeKey(key);
    if (blockedExactKeys.has(normalized) && !hasSafeSuffix(normalized)) {
      redactedKeys.push(key);
      if (!(`${normalized}_category` in sanitized)) {
        sanitized[`${normalized}_category`] = "redacted";
      }
      continue;
    }

    if (typeof rawValue === "string") {
      const value = rawValue.trim();
      if (!value) continue;
      const keySuggestsPhone = normalized.includes("phone") || normalized.includes("tel");
      if (looksLikeEmail(value) || (keySuggestsPhone && looksLikePhone(value))) {
        redactedKeys.push(key);
        if (!(`${normalized}_category` in sanitized)) {
          sanitized[`${normalized}_category`] = "redacted";
        }
        continue;
      }
      if (value.length > 160 && !hasSafeSuffix(normalized)) {
        redactedKeys.push(key);
        if (!(`${normalized}_category` in sanitized)) {
          sanitized[`${normalized}_category`] = "redacted";
        }
        continue;
      }
      sanitized[key] = value;
      continue;
    }

    sanitized[key] = rawValue;
  }

  if (redactedKeys.length > 0) {
    sanitized.redacted_fields_count = redactedKeys.length;
  }

  return {
    props: sanitized,
    redactedKeys
  };
}
