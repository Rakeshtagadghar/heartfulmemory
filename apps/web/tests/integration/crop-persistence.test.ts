import { buildApplyCropPatch } from "../../../../packages/editor/commands/applyCrop";
import { createCropApplyTransaction } from "../../../../packages/editor/history/cropTransactions";
import { normalizeCropModelV1 } from "../../../../packages/editor/models/cropModel";
import { migrateCropToV1 } from "../../../../packages/editor/serialize/migrations/cropV1";

describe("crop persistence pipeline", () => {
  it("builds a persisted crop patch that survives normalize/migrate", () => {
    const patch = buildApplyCropPatch({
      cropDraft: {
        enabled: true,
        mode: "frame",
        rectNorm: { x: 0.1, y: 0.2, w: 0.7, h: 0.6 },
        panNorm: { x: 0.3, y: 0.4 },
        zoom: 1.8,
        rotationDeg: 90,
        objectFit: "cover"
      },
      expectedVersion: 3
    });

    expect(patch.expectedVersion).toBe(3);
    const migrated = migrateCropToV1(patch.crop, { mode: "frame", objectFit: "cover" });
    const restored = normalizeCropModelV1(migrated);

    expect(restored.enabled).toBe(true);
    expect(restored.mode).toBe("frame");
    expect(restored.zoom).toBeCloseTo(1.8);
    expect(restored.rotationDeg).toBe(90);
    expect(restored.rectNorm.w).toBeCloseTo(0.7);
  });

  it("creates one transaction record when applying crop", () => {
    const tx = createCropApplyTransaction({
      frameId: "frame-1",
      before: null,
      after: { enabled: true, zoom: 2 }
    });

    expect(tx.intent).toBe("apply_crop");
    expect(tx.frameId).toBe("frame-1");
    expect(typeof tx.at).toBe("number");
  });
});
