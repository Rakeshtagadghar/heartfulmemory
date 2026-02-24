import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { convexMutation, anyApi, getConvexUrl } from "../../../lib/convex/ops";
import { isValidEmail, normalizeEmail } from "../../../lib/validation/email";
import { logError } from "../../../lib/server-log";

export const runtime = "nodejs";

const rateLimitStore = new Map<string, number[]>();

function getRateLimitConfig() {
  return {
    windowMs: Number(process.env.WAITLIST_RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.WAITLIST_RATE_LIMIT_MAX || 5)
  };
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string) {
  const { windowMs, max } = getRateLimitConfig();
  const now = Date.now();
  const recent = (rateLimitStore.get(ip) || []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recent.length >= max) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

async function storeEntryFallback(entry: Record<string, unknown>) {
  const filePath =
    process.env.WAITLIST_STORAGE_FILE || path.join(process.cwd(), ".data", "waitlist.jsonl");

  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

function inferSource(referrer?: string) {
  if (!referrer) return "landing";
  try {
    const url = new URL(referrer);
    if (url.pathname.startsWith("/pricing")) return "pricing";
    if (url.pathname.startsWith("/gift")) return "gift";
    if (url.pathname.startsWith("/templates")) return "templates";
  } catch {
    return "landing";
  }
  return "landing";
}

async function storeWaitlistEntry(entry: {
  email: string;
  referrer?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  timestamp: string;
  ip: string;
}) {
  if (!getConvexUrl()) {
    await storeEntryFallback(entry);
    return { ok: true as const, storage: "file" as const };
  }

  const result = await convexMutation<{ duplicate?: boolean }>(anyApi.waitlist.upsertEntry, {
    email: entry.email,
    source: inferSource(entry.referrer),
    utm_source: entry.utm_source ?? null,
    utm_campaign: entry.utm_campaign ?? null,
    utm_medium: entry.utm_medium ?? null,
    referrer: entry.referrer ?? null,
    createdAt: entry.timestamp
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    ok: true as const,
    storage: "convex" as const,
    duplicate: Boolean(result.data?.duplicate)
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = body as {
    email?: string;
    website?: string;
    referrer?: string;
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
  };

  if (parsed.website) {
    return NextResponse.json({ ok: false, error: "Rejected." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.email || "");
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const headerReferrer = request.headers.get("referer") || request.headers.get("referrer") || undefined;

  const entry = {
    email,
    referrer: parsed.referrer || headerReferrer,
    utm_source: parsed.utm_source,
    utm_campaign: parsed.utm_campaign,
    utm_medium: parsed.utm_medium,
    ip,
    timestamp: new Date().toISOString()
  };

  try {
    await storeWaitlistEntry(entry);
  } catch (error) {
    logError("waitlist_store_error", error);
    return NextResponse.json(
      { ok: false, error: "We could not save your request. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export const __waitlistTestUtils = {
  resetRateLimitStore() {
    rateLimitStore.clear();
  }
};
