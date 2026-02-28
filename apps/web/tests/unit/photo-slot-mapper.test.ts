import { describe, expect, it } from "vitest";
import { mapPhotosToImageSlots } from "../../../../packages/shared/populate/photoSlotMapper";

const makePhoto = (n: number) => ({
  mediaAssetId: `asset_${n}`,
  sourceUrl: `https://r2.example.com/photo_${n}.jpg`,
  width: 1200,
  height: 800
});

describe("mapPhotosToImageSlots", () => {
  it("assigns photos sequentially to slots", () => {
    const result = mapPhotosToImageSlots({
      slotIds: ["slot_a", "slot_b", "slot_c"],
      photos: [makePhoto(1), makePhoto(2), makePhoto(3)]
    });
    expect(result.slotImages["slot_a"]?.mediaAssetId).toBe("asset_1");
    expect(result.slotImages["slot_b"]?.mediaAssetId).toBe("asset_2");
    expect(result.slotImages["slot_c"]?.mediaAssetId).toBe("asset_3");
  });

  it("leaves slots empty when there are fewer photos than slots", () => {
    const result = mapPhotosToImageSlots({
      slotIds: ["slot_a", "slot_b", "slot_c"],
      photos: [makePhoto(1)]
    });
    expect(result.slotImages["slot_a"]?.sourceUrl).toBe("https://r2.example.com/photo_1.jpg");
    expect(result.slotImages["slot_b"]).toBeUndefined();
    expect(result.slotImages["slot_c"]).toBeUndefined();
  });

  it("ignores extra photos beyond available slots", () => {
    const result = mapPhotosToImageSlots({
      slotIds: ["slot_a"],
      photos: [makePhoto(1), makePhoto(2), makePhoto(3)]
    });
    expect(Object.keys(result.slotImages)).toHaveLength(1);
    expect(result.slotImages["slot_a"]?.mediaAssetId).toBe("asset_1");
  });

  it("returns empty slotImages when no photos are provided", () => {
    const result = mapPhotosToImageSlots({ slotIds: ["slot_a", "slot_b"], photos: [] });
    expect(Object.keys(result.slotImages)).toHaveLength(0);
  });

  it("returns empty slotImages when no slots are provided", () => {
    const result = mapPhotosToImageSlots({ slotIds: [], photos: [makePhoto(1)] });
    expect(Object.keys(result.slotImages)).toHaveLength(0);
  });

  it("populates sourceUrl and previewUrl from photo sourceUrl", () => {
    const result = mapPhotosToImageSlots({
      slotIds: ["slot_a"],
      photos: [makePhoto(1)]
    });
    const img = result.slotImages["slot_a"];
    expect(img?.sourceUrl).toBe("https://r2.example.com/photo_1.jpg");
    expect(img?.previewUrl).toBe("https://r2.example.com/photo_1.jpg");
  });

  it("skips photos with empty sourceUrl", () => {
    const result = mapPhotosToImageSlots({
      slotIds: ["slot_a", "slot_b"],
      photos: [
        { mediaAssetId: "asset_1", sourceUrl: "", width: null, height: null },
        makePhoto(2)
      ]
    });
    // slot_a gets photo[0] which has empty sourceUrl → skipped; slot_b gets photo[1]
    expect(result.slotImages["slot_a"]).toBeUndefined();
    expect(result.slotImages["slot_b"]?.mediaAssetId).toBe("asset_2");
  });
});
