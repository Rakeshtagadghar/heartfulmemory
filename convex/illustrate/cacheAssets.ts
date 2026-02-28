"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";
import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";
import { cacheProviderImage } from "../../lib/storage/imageCachePipeline";

type CacheableProviderAsset = ProviderAssetNormalized & { query?: string };

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) throw new Error("Unauthorized");
  return { subject };
}

function sourceFromProvider(provider: "unsplash" | "pexels") {
  return provider;
}

export async function cacheSelectedProviderAssets(input: {
  ctx: ActionCtx;
  viewerSubject: string;
  assets: any[];
  maxDownloadMb: number;
  timeoutMs: number;
}): Promise<any> {
  const cached: any[] = [];
  for (const asset of input.assets) {
    const cachedImage = await cacheProviderImage({
      providerAsset: asset,
      maxDownloadBytes: input.maxDownloadMb * 1024 * 1024,
      timeoutMs: input.timeoutMs
    });
    const media = await input.ctx.runMutation(api.mediaAssets.createSystemCached, {
      viewerSubject: input.viewerSubject,
      source: sourceFromProvider(asset.provider),
      sourceId: asset.id,
      cachedUrl: cachedImage.cachedUrl,
      thumbUrl: cachedImage.thumbUrl,
      width: Math.max(1, asset.width || cachedImage.width || 1),
      height: Math.max(1, asset.height || cachedImage.height || 1),
      mime: cachedImage.mime,
      attribution: {
        authorName: asset.authorName,
        authorUrl: asset.authorUrl ?? null,
        assetUrl: asset.assetUrl ?? null,
        licenseUrl: asset.licenseUrl ?? null,
        provider: sourceFromProvider(asset.provider),
        attributionText: asset.attributionText
      }
    });
    cached.push({
      providerAsset: asset,
      mediaAssetId: media.mediaAssetId,
      mediaAsset: media.mediaAsset,
      reused: media.reused,
      cacheMode: cachedImage.cacheMode
    });
  }
  return cached;
}

export const cacheSelectedAssets = action({
  args: {
    viewerSubject: v.optional(v.string()),
    assets: v.array(v.any()),
    maxDownloadMb: v.optional(v.number()),
    timeoutMs: v.optional(v.number())
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);
      const result = await cacheSelectedProviderAssets({
        ctx,
        viewerSubject: viewer.subject,
        assets: args.assets as CacheableProviderAsset[],
        maxDownloadMb: args.maxDownloadMb ?? 15,
        timeoutMs: args.timeoutMs ?? 45000
      });
      return { ok: true as const, assets: result };
    } catch (error) {
      return {
        ok: false as const,
        errorCode: "CACHE_FAILED" as const,
        message: error instanceof Error ? error.message : "Image cache failed",
        retryable: true
      };
    }
  }
});
