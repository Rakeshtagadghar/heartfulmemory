"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";
import { searchProviderAssets, type ProviderMode } from "./providers";

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.sort();
    return parsed.toString();
  } catch {
    return url;
  }
}

function passesThreshold(asset: ProviderAssetNormalized, minShortSidePx: number) {
  if (!asset.width || !asset.height) return true;
  return Math.min(asset.width, asset.height) >= minShortSidePx;
}

function matchesOrientation(asset: ProviderAssetNormalized, orientation: "landscape" | "portrait" | "square") {
  if (!asset.width || !asset.height) return true;
  if (orientation === "square") return Math.abs(asset.width / asset.height - 1) < 0.2;
  if (orientation === "landscape") return asset.width >= asset.height;
  return asset.height >= asset.width;
}

function dedupeCandidates(candidates: Array<ProviderAssetNormalized & { query: string }>) {
  const seen = new Set<string>();
  const out: Array<ProviderAssetNormalized & { query: string }> = [];
  for (const candidate of candidates) {
    const key = `${candidate.provider}:${candidate.id}:${normalizeUrl(candidate.fullUrl)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

export async function fetchIllustrationCandidates(input: {
  providerMode: ProviderMode;
  queries: string[];
  orientation: "landscape" | "portrait" | "square";
  page?: number;
  perQueryLimit?: number;
  minShortSidePx: number;
}) {
  const perQueryLimit = Math.max(1, Math.min(50, input.perQueryLimit ?? 24));
  const page = Math.max(1, input.page ?? 1);

  const results = await Promise.all(
    input.queries.map(async (query) => {
      try {
        const items = await searchProviderAssets({ providerMode: input.providerMode, query, page });
        return items.slice(0, perQueryLimit).map((item) => ({ ...item, query }));
      } catch {
        return [] as Array<ProviderAssetNormalized & { query: string }>;
      }
    })
  );

  const flat = dedupeCandidates(results.flat());
  const filtered = flat.filter(
    (asset) => matchesOrientation(asset, input.orientation) && passesThreshold(asset, input.minShortSidePx)
  );

  return {
    ok: true as const,
    candidates: filtered,
    droppedLowRes: Math.max(0, flat.length - filtered.length)
  };
}

export const fetchCandidates = action({
  args: {
    viewerSubject: v.optional(v.string()),
    provider: v.union(v.literal("unsplash"), v.literal("pexels"), v.literal("both")),
    queries: v.array(v.string()),
    orientation: v.union(v.literal("landscape"), v.literal("portrait"), v.literal("square")),
    page: v.optional(v.number()),
    perPage: v.optional(v.number()),
    minShortSidePx: v.optional(v.number())
  },
  handler: async (_ctx, args) => {
    try {
      const result = await fetchIllustrationCandidates({
        providerMode: args.provider,
        queries: args.queries,
        orientation: args.orientation,
        page: args.page ?? 1,
        perQueryLimit: args.perPage ?? 24,
        minShortSidePx: args.minShortSidePx ?? 1000
      });
      return result;
    } catch (error) {
      return {
        ok: false as const,
        errorCode: "PROVIDER_FETCH_FAILED" as const,
        message: error instanceof Error ? error.message : "Provider fetch failed",
        retryable: true
      };
    }
  }
});

