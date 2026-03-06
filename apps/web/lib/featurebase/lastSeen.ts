"use client";

const CHANGELOG_LAST_SEEN_KEY = "featurebase.changelog.last_seen_at";
const CHANGELOG_UNREAD_COUNT_KEY = "featurebase.changelog.unread_count";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readNumber(key: string) {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeNumber(key: string, value: number) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
}

export function readFeaturebaseChangelogLastSeenAt() {
  return readNumber(CHANGELOG_LAST_SEEN_KEY);
}

export function markFeaturebaseChangelogSeen(at = Date.now()) {
  writeNumber(CHANGELOG_LAST_SEEN_KEY, at);
}

export function readFeaturebaseChangelogUnreadCount() {
  return readNumber(CHANGELOG_UNREAD_COUNT_KEY) ?? 0;
}

export function writeFeaturebaseChangelogUnreadCount(count: number) {
  writeNumber(CHANGELOG_UNREAD_COUNT_KEY, count);
}
