import { NextResponse } from "next/server";
import limits from "../../../../../config/limits.default.json";
import { requireAuthenticatedUser } from "../../../../../lib/auth/server";
import { getMediaConfig } from "../../../../../lib/config/media";
import { anyApi, convexMutation, getConvexUrl } from "../../../../../lib/convex/ops";
import { signR2PutObject } from "../../../../../lib/r2/server";
import { generateUploadObjectKey } from "../../../../../lib/uploads/keygen";
import { getR2FreeTierCaps } from "../../../../../lib/uploads/r2Quota";

export const runtime = "nodejs";

const uploadSignRateLimit = new Map<string, { count: number; resetAt: number }>();

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function isAllowedImageMime(mimeType: string) {
  const media = getMediaConfig();
  return media.uploads.allowedMimePrefixes.some((prefix) => mimeType.startsWith(prefix));
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 30;
  const existing = uploadSignRateLimit.get(key);
  if (!existing || existing.resetAt <= now) {
    uploadSignRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }
  if (existing.count >= max) {
    return { ok: false as const, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  uploadSignRateLimit.set(key, existing);
  return { ok: true as const };
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/app");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rate = checkRateLimit(`${user.id}:${ip}`);
  if (!rate.ok) {
    return jsonError(429, "Too many upload sign requests. Please retry shortly.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const input = body as {
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    storybookId?: string;
  };

  if (!input.fileName || !input.mimeType || typeof input.sizeBytes !== "number") {
    return jsonError(400, "fileName, mimeType, sizeBytes are required.");
  }
  if (!isAllowedImageMime(input.mimeType)) {
    return jsonError(400, "Only image uploads are allowed.");
  }

  const media = getMediaConfig();
  const maxBytes = media.uploads.maxUploadBytes || limits.uploads.imageMaxBytes;
  if (input.sizeBytes > maxBytes) {
    return jsonError(400, `File too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB.`);
  }

  const key = generateUploadObjectKey({
    userId: user.id,
    storybookId: input.storybookId ?? null,
    fileName: input.fileName
  });
  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? "").trim();
  const publicUrl =
    publicBaseUrl.length > 0 ? `${publicBaseUrl.replace(/\/$/, "")}/${key}` : undefined;

  const r2Configured = Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );

  if (!r2Configured) {
    return NextResponse.json({
      ok: true,
      strategy: "local_dev",
      uploadUrl: null,
      key,
      headersRequired: {},
      publicUrl: null,
      maxBytes
    });
  }

  const caps = getR2FreeTierCaps();
  if (caps.hardStopEnabled) {
    if (!getConvexUrl()) {
      return jsonError(500, "Convex is required for R2 quota enforcement.");
    }
    const reserve = await convexMutation<unknown>(anyApi.assets.reserveR2UploadQuota, {
      viewerSubject: user.id,
      sizeBytes: input.sizeBytes,
      caps: {
        monthlyStorageBytesCap: caps.monthlyStorageBytesCap,
        monthlyClassAOpsCap: caps.monthlyClassAOpsCap,
        monthlyClassBOpsCap: caps.monthlyClassBOpsCap
      }
    });
    if (!reserve.ok) {
      if (reserve.error.includes("R2_FREE_TIER_LIMIT_STORAGE_MONTHLY")) {
        return jsonError(429, "R2 free-tier storage cap reached for this month. Uploads are disabled.");
      }
      if (reserve.error.includes("R2_FREE_TIER_LIMIT_CLASS_A_MONTHLY")) {
        return jsonError(429, "R2 free-tier Class A operation cap reached for this month. Uploads are disabled.");
      }
      return jsonError(500, "Could not reserve R2 quota.");
    }
  }

  try {
    const signed = await signR2PutObject({ key, mimeType: input.mimeType });
    return NextResponse.json({
      ok: true,
      strategy: "r2_put",
      uploadUrl: signed.uploadUrl,
      key: signed.key,
      headersRequired: signed.headersRequired,
      publicUrl: publicUrl ?? null,
      maxBytes
    });
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Failed to sign upload.");
  }
}
