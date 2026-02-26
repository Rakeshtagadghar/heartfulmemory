import { describe, expect, it } from "vitest";
import { mapIllustrationsToImageSlots } from "../../../../packages/shared/populate/imageSlotMapper";

describe("imageSlotMapper integration", () => {
  it("assigns cachedUrl/previewUrl, attribution, and default crop for mapped slots", () => {
    const result = mapIllustrationsToImageSlots({
      slotIds: ["image1", "image2"],
      slotAssets: {
        image1: {
          mediaAssetId: "ma_1",
          cachedUrl: "https://cdn.example.com/full.jpg",
          thumbUrl: "https://cdn.example.com/thumb.jpg",
          width: 1600,
          height: 1200,
          attribution: {
            provider: "unsplash",
            authorName: "Photographer",
            authorUrl: "https://example.com/author",
            assetUrl: "https://example.com/asset",
            licenseUrl: "https://example.com/license",
            attributionText: "Photo by Photographer"
          },
          providerMetaSnapshot: {}
        },
        image2: {
          mediaAssetId: "ma_2",
          cachedUrl: "https://cdn.example.com/second.jpg",
          thumbUrl: null,
          width: 900,
          height: 900,
          attribution: { provider: "pexels" },
          providerMetaSnapshot: {}
        }
      }
    });

    expect(result.slotImages.image1).toMatchObject({
      mediaAssetId: "ma_1",
      sourceUrl: "https://cdn.example.com/full.jpg",
      previewUrl: "https://cdn.example.com/thumb.jpg",
      attribution: {
        provider: "unsplash",
        authorName: "Photographer"
      }
    });
    expect(result.slotImages.image2.previewUrl).toBe("https://cdn.example.com/second.jpg");
    expect(result.slotImages.image1.crop).toMatchObject({
      enabled: true,
      mode: "frame",
      objectFit: "cover",
      focalX: 0.5,
      focalY: 0.5
    });
  });

  it("leaves missing assignments unmapped", () => {
    const result = mapIllustrationsToImageSlots({
      slotIds: ["image1"],
      slotAssets: {}
    });
    expect(result.slotImages).toEqual({});
  });
});

