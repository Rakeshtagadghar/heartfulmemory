import { buildFrameFillImagePatch } from "./fillFrameWithImage";

type FillSlotImageInput = {
  frameType: "IMAGE" | "FRAME";
  currentContent: Record<string, unknown> | null | undefined;
  assetId?: string | null;
  sourceUrl: string;
  previewUrl?: string | null;
  caption?: string | null;
  attribution?: Record<string, unknown> | null;
};

export function buildFillSlotWithImagePatch(input: FillSlotImageInput) {
  if (input.frameType === "FRAME") {
    return buildFrameFillImagePatch(input.currentContent, {
      assetId: input.assetId,
      sourceUrl: input.sourceUrl,
      previewUrl: input.previewUrl,
      attribution: input.attribution
    });
  }

  return {
    content: {
      ...(input.currentContent ?? {}),
      kind: "image_frame_v1",
      assetId: input.assetId ?? undefined,
      sourceUrl: input.sourceUrl,
      previewUrl: input.previewUrl ?? input.sourceUrl,
      caption: input.caption ?? "",
      attribution: input.attribution ?? null
    }
  };
}
