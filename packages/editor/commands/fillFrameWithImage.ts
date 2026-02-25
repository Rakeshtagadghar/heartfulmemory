type FrameImageRefInput = {
  assetId?: string | null;
  sourceUrl: string;
  previewUrl?: string | null;
  attribution?: Record<string, unknown> | null;
};

export function buildFrameFillImagePatch(
  currentContent: Record<string, unknown> | null | undefined,
  input: FrameImageRefInput
) {
  return {
    content: {
      ...(currentContent ?? {}),
      kind: "frame_node_v1",
      imageRef: {
        assetId: input.assetId ?? undefined,
        sourceUrl: input.sourceUrl,
        previewUrl: input.previewUrl ?? input.sourceUrl
      },
      attribution: input.attribution ?? null
    }
  };
}

