"use client";

import { useCallback, useRef } from "react";
import type { AssetDTO } from "../../../lib/dto/asset";
import type { PageDTO } from "../../../lib/dto/page";
import type { FrameDTO } from "../../../lib/dto/frame";
import { createFrameAction } from "../../../lib/actions/editor2";
import type { NormalizedStockResult } from "../../../lib/stock/types";
import { computeInsertedImagePlacement } from "../../../../../packages/editor/commands/insertImage";
import type { MediaAttribution } from "../../../../../packages/shared/media/types";
import type { CanvasImageNode } from "../../../../../packages/shared/editor/nodes/imageNode";

type InsertImageFrameResult = { ok: true; frame: FrameDTO } | { ok: false; error: string };

type InsertImageFrameInput = {
  storybookId: string;
  page: PageDTO | null;
  currentFrames: FrameDTO[];
  sourceUrl: string;
  previewUrl?: string | null;
  assetId?: string | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  attribution?: MediaAttribution | null;
};

function buildInsertDedupeKey(parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? "")).join("|");
}

export function useInsertImage() {
  const lastInsertRef = useRef<{ key: string; at: number } | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);

  const insertImageFrame = useCallback(async (input: InsertImageFrameInput): Promise<InsertImageFrameResult> => {
    if (!input.page) {
      return { ok: false, error: "Select or create a page first." };
    }

    const dedupeKey = buildInsertDedupeKey([
      input.storybookId,
      input.page.id,
      input.assetId ?? input.sourceUrl,
      input.width ?? 0,
      input.height ?? 0
    ]);
    const now = Date.now();
    const lastInsert = lastInsertRef.current;
    if (inFlightKeyRef.current === dedupeKey) {
      return { ok: false, error: "Insert in progress." };
    }
    if (lastInsert && lastInsert.key === dedupeKey && now - lastInsert.at < 600) {
      return { ok: false, error: "Duplicate insert ignored." };
    }

    inFlightKeyRef.current = dedupeKey;
    try {
      const placement = computeInsertedImagePlacement({
        pageWidth: input.page.width_px,
        pageHeight: input.page.height_px,
        intrinsicWidth: input.width ?? null,
        intrinsicHeight: input.height ?? null
      });
      const canvasImageNode: CanvasImageNode = {
        id: `img_${Date.now()}`,
        type: "image",
        src: input.sourceUrl,
        x: placement.x,
        y: placement.y,
        w: placement.w,
        h: placement.h,
        rotation: 0,
        opacity: 1,
        lock: false,
        attribution: input.attribution ?? null
      };

      const result = await createFrameAction(input.storybookId, input.page.id, {
        type: "IMAGE",
        x: canvasImageNode.x,
        y: canvasImageNode.y,
        w: canvasImageNode.w,
        h: canvasImageNode.h,
        style: {},
        content: {
          kind: "image_frame_v1",
          assetId: input.assetId ?? undefined,
          sourceUrl: canvasImageNode.src,
          previewUrl: input.previewUrl ?? canvasImageNode.src,
          caption: input.caption ?? "",
          attribution: canvasImageNode.attribution
        }
      });
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      lastInsertRef.current = { key: dedupeKey, at: now };
      return { ok: true, frame: result.data };
    } finally {
      inFlightKeyRef.current = null;
    }
  }, []);

  const insertFromUploadAsset = useCallback(
    async (input: { storybookId: string; page: PageDTO | null; currentFrames: FrameDTO[]; asset: AssetDTO }) =>
      insertImageFrame({
        storybookId: input.storybookId,
        page: input.page,
        currentFrames: input.currentFrames,
        sourceUrl:
          input.asset.storage_provider === "R2"
            ? `/api/assets/view/${input.asset.id}?purpose=preview`
            : input.asset.source_url ?? "",
        previewUrl:
          input.asset.storage_provider === "R2"
            ? `/api/assets/view/${input.asset.id}?purpose=preview`
            : input.asset.source_url ?? "",
        assetId: input.asset.id,
        width: input.asset.width ?? null,
        height: input.asset.height ?? null,
        attribution: {
          provider: "upload"
        }
      }),
    [insertImageFrame]
  );

  const insertFromProviderResult = useCallback(
    async (input: {
      storybookId: string;
      page: PageDTO | null;
      currentFrames: FrameDTO[];
      asset: AssetDTO;
      result: NormalizedStockResult;
    }) =>
      insertImageFrame({
        storybookId: input.storybookId,
        page: input.page,
        currentFrames: input.currentFrames,
        sourceUrl: input.result.previewUrl || input.result.fullUrl || input.asset.source_url || "",
        previewUrl: input.result.previewUrl,
        assetId: input.asset.id,
        width: input.result.width ?? input.asset.width ?? null,
        height: input.result.height ?? input.asset.height ?? null,
        attribution: {
          provider: input.result.provider,
          authorName: input.result.authorName,
          authorUrl: input.result.authorUrl,
          assetUrl: input.result.sourceUrl,
          licenseUrl: input.result.licenseUrl,
          attributionText: input.result.attributionText
        }
      }),
    [insertImageFrame]
  );

  return { insertFromUploadAsset, insertFromProviderResult };
}
