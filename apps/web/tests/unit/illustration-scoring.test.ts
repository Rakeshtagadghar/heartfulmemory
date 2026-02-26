import { describe, expect, it } from "vitest";
import { scoreCandidateForSlot } from "../../../../convex/illustrate/scoring";
import { selectCandidatesForSlots } from "../../../../convex/illustrate/selectForSlots";

const slotTarget = {
  slotId: "image1",
  aspectTarget: 4 / 3,
  orientation: "landscape" as const,
  minShortSidePx: 1800
};

describe("Sprint 20 illustration scoring", () => {
  it("ranks higher-resolution candidates higher when aspect/relevance are similar", () => {
    const usedProviders = new Set<string>();
    const usedAuthors = new Set<string>();

    const lowRes = scoreCandidateForSlot({
      candidate: {
        provider: "unsplash",
        id: "low",
        thumbUrl: "https://x.test/low-thumb.jpg",
        fullUrl: "https://x.test/low.jpg",
        width: 1800,
        height: 1350,
        authorName: "Author A",
        authorUrl: null,
        assetUrl: null,
        licenseUrl: null,
        attributionText: "warm family kitchen scene",
        query: "warm family kitchen"
      },
      slotTarget,
      keywords: ["family", "kitchen"],
      usedProviders,
      usedAuthors
    });

    const highRes = scoreCandidateForSlot({
      candidate: {
        provider: "pexels",
        id: "high",
        thumbUrl: "https://x.test/high-thumb.jpg",
        fullUrl: "https://x.test/high.jpg",
        width: 4200,
        height: 3150,
        authorName: "Author B",
        authorUrl: null,
        assetUrl: null,
        licenseUrl: null,
        attributionText: "warm family kitchen scene",
        query: "warm family kitchen"
      },
      slotTarget,
      keywords: ["family", "kitchen"],
      usedProviders,
      usedAuthors
    });

    expect(highRes.qualityScore).toBeGreaterThan(lowRes.qualityScore);
    expect(highRes.score).toBeGreaterThan(lowRes.score);
  });

  it("prefers aspect-matching candidates and preserves locked slots in selection", () => {
    const wide = {
      provider: "unsplash" as const,
      id: "wide",
      thumbUrl: "https://x.test/wide-thumb.jpg",
      fullUrl: "https://x.test/wide.jpg",
      width: 3000,
      height: 2250,
      authorName: "Wide Author",
      authorUrl: null,
      assetUrl: null,
      licenseUrl: null,
      attributionText: "family porch",
      query: "family porch"
    };
    const portrait = {
      provider: "pexels" as const,
      id: "portrait",
      thumbUrl: "https://x.test/portrait-thumb.jpg",
      fullUrl: "https://x.test/portrait.jpg",
      width: 2200,
      height: 3200,
      authorName: "Portrait Author",
      authorUrl: null,
      assetUrl: null,
      licenseUrl: null,
      attributionText: "family porch",
      query: "family porch"
    };

    const selection = selectCandidatesForSlots({
      slotTargets: [
        slotTarget,
        { slotId: "image2", aspectTarget: 1, orientation: "square", minShortSidePx: 1200 }
      ],
      candidates: [wide, portrait],
      keywords: ["family", "porch"],
      lockedSlotIds: ["image2"],
      existingAssignments: [{ slotId: "image2", candidate: portrait }]
    });

    const image1 = selection.selections.find((s) => s.slotId === "image1");
    const image2 = selection.selections.find((s) => s.slotId === "image2");

    expect(image1?.candidate?.id).toBe("wide");
    expect(image2?.candidate?.id).toBe("portrait");
    expect(image2?.scoresConsidered).toHaveLength(0);
  });
});
