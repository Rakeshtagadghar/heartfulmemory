export type FrameNodeStyleV1 = {
  fill?: string | null;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  opacity: number;
};

export type FrameNodeContentV1 = {
  kind: "frame_node_v1";
  placeholderLabel?: string;
  imageRef?: {
    assetId?: string;
    sourceUrl?: string;
    previewUrl?: string;
  } | null;
};

export const defaultFrameNodeStyleV1: FrameNodeStyleV1 = {
  fill: "#f5f1e8",
  stroke: "#c7b796",
  strokeWidth: 1,
  cornerRadius: 18,
  opacity: 1
};

export function normalizeFrameNodeStyleV1(style: Record<string, unknown> | null | undefined): FrameNodeStyleV1 {
  const input = style ?? {};
  return {
    fill: typeof input.fill === "string" ? input.fill : defaultFrameNodeStyleV1.fill,
    stroke: typeof input.stroke === "string" && input.stroke.trim() ? input.stroke : defaultFrameNodeStyleV1.stroke,
    strokeWidth:
      typeof input.strokeWidth === "number" && Number.isFinite(input.strokeWidth)
        ? Math.max(0, Math.min(32, input.strokeWidth))
        : defaultFrameNodeStyleV1.strokeWidth,
    cornerRadius:
      typeof input.cornerRadius === "number" && Number.isFinite(input.cornerRadius)
        ? Math.max(0, Math.min(240, input.cornerRadius))
        : defaultFrameNodeStyleV1.cornerRadius,
    opacity:
      typeof input.opacity === "number" && Number.isFinite(input.opacity)
        ? Math.max(0, Math.min(1, input.opacity))
        : defaultFrameNodeStyleV1.opacity
  };
}

export function normalizeFrameNodeContentV1(
  content: Record<string, unknown> | null | undefined
): FrameNodeContentV1 {
  const imageRefRaw = content?.imageRef;
  const imageRefInput =
    imageRefRaw && typeof imageRefRaw === "object" && !Array.isArray(imageRefRaw)
      ? (imageRefRaw as Record<string, unknown>)
      : null;
  const imageRef =
    imageRefInput
      ? {
          assetId: typeof imageRefInput.assetId === "string" ? imageRefInput.assetId : undefined,
          sourceUrl: typeof imageRefInput.sourceUrl === "string" ? imageRefInput.sourceUrl : undefined,
          previewUrl: typeof imageRefInput.previewUrl === "string" ? imageRefInput.previewUrl : undefined
        }
      : null;

  return {
    kind: "frame_node_v1",
    placeholderLabel:
      typeof content?.placeholderLabel === "string" && content.placeholderLabel.trim()
        ? content.placeholderLabel
        : "Frame placeholder",
    imageRef
  };
}
