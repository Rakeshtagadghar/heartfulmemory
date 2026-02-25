import { buildFrameFillImagePatch } from "../../../../packages/editor/commands/fillFrameWithImage";

describe("fillFrameWithImage command", () => {
  it("creates a non-destructive frame imageRef patch and preserves existing placeholder fields", () => {
    const patch = buildFrameFillImagePatch(
      {
        kind: "frame_node_v1",
        placeholderLabel: "Photo Frame",
        someOtherField: "keep-me"
      },
      {
        assetId: "asset_123",
        sourceUrl: "https://example.com/full.jpg",
        previewUrl: "https://example.com/preview.jpg",
        attribution: { provider: "upload" }
      }
    );

    expect(patch.content).toMatchObject({
      kind: "frame_node_v1",
      placeholderLabel: "Photo Frame",
      someOtherField: "keep-me",
      imageRef: {
        assetId: "asset_123",
        sourceUrl: "https://example.com/full.jpg",
        previewUrl: "https://example.com/preview.jpg"
      },
      attribution: { provider: "upload" }
    });
  });
});

