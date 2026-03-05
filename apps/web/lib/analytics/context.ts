"use client";

import type { AnalyticsProps } from "./events";

const SESSION_STORAGE_KEY = "analytics_session_id_v1";
const SESSION_COOKIE_KEY = "analytics_session_id";
const ANALYTICS_CONSENT_COOKIE = "analytics_consent";
const ANALYTICS_REJECTED_COOKIE = "analytics_rejected";

const rejectedConsentValues = new Set(["0", "false", "no", "off", "reject", "rejected", "deny", "denied"]);
const truthyValues = new Set(["1", "true", "yes", "on"]);

let cachedSessionId: string | null = null;
let analyticsUserContext: {
  user_id?: string;
  workspace_id?: string;
  project_id?: string;
} = {};

function readCookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match) return null;
  return decodeURIComponent(match[1] ?? "");
}

function writeSessionCookie(sessionId: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_KEY}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

function readSessionFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!value) return null;
    return value.trim() || null;
  } catch {
    return null;
  }
}

function saveSessionToStorage(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Ignore storage failures; cookie still carries session id.
  }
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replaceAll("-", "");
  }
  return `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getRelease() {
  const candidates = [
    process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    process.env.NEXT_PUBLIC_APP_RELEASE,
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return "dev";
}

function getDeviceCategory() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

function inferPageType(pathname: string) {
  if (!pathname || pathname === "/") return "landing";
  if (pathname.startsWith("/auth")) return "auth";
  if (pathname.startsWith("/create")) return "create";
  if (pathname.startsWith("/app/storybooks") && pathname.includes("/layout")) return "studio";
  if (pathname.startsWith("/app")) return "app";
  if (pathname.startsWith("/pricing")) return "pricing";
  return "unknown";
}

function normalize(value: string | null) {
  if (!value) return "";
  return value.trim().toLowerCase();
}

export function isAnalyticsRejectedByCookie() {
  const rejectedRaw = normalize(readCookieValue(ANALYTICS_REJECTED_COOKIE));
  if (rejectedRaw && truthyValues.has(rejectedRaw)) return true;

  const consentRaw = normalize(readCookieValue(ANALYTICS_CONSENT_COOKIE));
  if (!consentRaw) return false;
  return rejectedConsentValues.has(consentRaw);
}

export function isAnalyticsTrackingAllowed() {
  if (typeof window === "undefined") return false;
  return !isAnalyticsRejectedByCookie();
}

export function setAnalyticsUserContext(input: {
  userId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
}) {
  analyticsUserContext = {
    user_id: input.userId ?? undefined,
    workspace_id: input.workspaceId ?? undefined,
    project_id: input.projectId ?? undefined
  };
}

export function clearAnalyticsUserContext() {
  analyticsUserContext = {};
}

export function getOrCreateAnalyticsSessionId() {
  if (cachedSessionId) return cachedSessionId;

  const fromStorage = readSessionFromStorage();
  if (fromStorage) {
    cachedSessionId = fromStorage;
    writeSessionCookie(fromStorage);
    return fromStorage;
  }

  const fromCookie = readCookieValue(SESSION_COOKIE_KEY);
  if (fromCookie) {
    cachedSessionId = fromCookie;
    saveSessionToStorage(fromCookie);
    return fromCookie;
  }

  const created = createSessionId();
  cachedSessionId = created;
  saveSessionToStorage(created);
  writeSessionCookie(created);
  return created;
}

export function getAnalyticsContext(): AnalyticsProps {
  if (typeof window === "undefined") return {};

  const url = new URL(window.location.href);
  const referrer = document.referrer || undefined;
  const utmSource = url.searchParams.get("utm_source") || undefined;
  const utmMedium = url.searchParams.get("utm_medium") || undefined;
  const utmCampaign = url.searchParams.get("utm_campaign") || undefined;
  let trafficSource = utmSource;
  if (!trafficSource && referrer) {
    try {
      trafficSource = new URL(referrer).hostname || undefined;
    } catch {
      trafficSource = undefined;
    }
  }

  return {
    session_id: getOrCreateAnalyticsSessionId(),
    release: getRelease(),
    route: window.location.pathname,
    page_type: inferPageType(window.location.pathname),
    device_category: getDeviceCategory(),
    traffic_source: trafficSource,
    referrer,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    ...analyticsUserContext
  };
}
