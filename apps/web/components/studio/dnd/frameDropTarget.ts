import type { FrameDTO } from "../../../lib/dto/frame";
import type { NormalizedStockResult } from "../../../lib/stock/types";

export function isPointInsideFrameBounds(
  frame: Pick<FrameDTO, "x" | "y" | "w" | "h">,
  point: { x: number; y: number }
) {
  return (
    point.x >= frame.x &&
    point.y >= frame.y &&
    point.x <= frame.x + frame.w &&
    point.y <= frame.y + frame.h
  );
}

export function findTopmostFrameDropTarget(
  frames: FrameDTO[],
  point: { x: number; y: number }
) {
  return frames
    .filter((frame) => frame.type === "FRAME" && !frame.locked && isPointInsideFrameBounds(frame, point))
    .sort((a, b) => b.z_index - a.z_index)[0] ?? null;
}

export const STUDIO_MEDIA_DRAG_MIME = "application/x-memorioso-media-drag";

export type DraggedMediaPayload =
  | {
      kind: "asset";
      assetId: string;
    }
  | {
      kind: "stock";
      result: NormalizedStockResult;
    };

export function setDraggedMediaPayload(dataTransfer: DataTransfer, payload: DraggedMediaPayload) {
  const serialized = JSON.stringify(payload);
  dataTransfer.setData(STUDIO_MEDIA_DRAG_MIME, serialized);
  dataTransfer.setData("text/plain", payload.kind === "asset" ? payload.assetId : payload.result.assetId);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseAssetDraggedPayload(parsed: Record<string, unknown>): DraggedMediaPayload | null {
  const assetId = parsed.assetId;
  if (typeof assetId !== "string" || !assetId) return null;
  return { kind: "asset", assetId };
}

function parseStockDraggedPayload(parsed: Record<string, unknown>): DraggedMediaPayload | null {
  const result = asRecord(parsed.result);
  if (!result) return null;
  const provider = result.provider;
  const assetId = result.assetId;
  const thumbUrl = result.thumbUrl;
  const previewUrl = result.previewUrl;
  const authorName = result.authorName;
  const licenseName = result.licenseName;
  const attributionText = result.attributionText;
  const requiresAttribution = result.requiresAttribution;
  if (
    (provider !== "unsplash" && provider !== "pexels") ||
    typeof assetId !== "string" ||
    typeof thumbUrl !== "string" ||
    typeof previewUrl !== "string" ||
    typeof authorName !== "string" ||
    typeof licenseName !== "string" ||
    typeof attributionText !== "string" ||
    typeof requiresAttribution !== "boolean"
  ) {
    return null;
  }
  return {
    kind: "stock",
    result: {
      provider,
      assetId,
      thumbUrl,
      previewUrl,
      fullUrl: readNullableString(result.fullUrl),
      width: readNullableNumber(result.width),
      height: readNullableNumber(result.height),
      authorName,
      authorUrl: readNullableString(result.authorUrl),
      sourceUrl: readNullableString(result.sourceUrl),
      licenseName,
      licenseUrl: readNullableString(result.licenseUrl),
      requiresAttribution,
      attributionText
    }
  };
}

export function getDraggedMediaPayload(dataTransfer: DataTransfer): DraggedMediaPayload | null {
  const raw = dataTransfer.getData(STUDIO_MEDIA_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = asRecord(JSON.parse(raw));
    if (!parsed) return null;
    const kind = parsed.kind;
    if (kind === "asset") return parseAssetDraggedPayload(parsed);
    if (kind === "stock") return parseStockDraggedPayload(parsed);
    return null;
  } catch {
    return null;
  }
}
