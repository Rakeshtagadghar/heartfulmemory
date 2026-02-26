import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";
import type { SlotTarget } from "../../packages/shared/illustrations/illustrationTypes";
import { scoreCandidateForSlot, type CandidateForScoring, type ScoredCandidate } from "./scoring";

type SlotSelection = {
  slotId: string;
  candidate: (ProviderAssetNormalized & { query?: string }) | null;
  scoresConsidered: ScoredCandidate[];
  thresholdRelaxed: boolean;
};

function minShortSide(candidate: ProviderAssetNormalized) {
  if (!candidate.width || !candidate.height) return Number.POSITIVE_INFINITY;
  return Math.min(candidate.width, candidate.height);
}

export function selectCandidatesForSlots(input: {
  slotTargets: SlotTarget[];
  candidates: Array<ProviderAssetNormalized & { query?: string }>;
  keywords: string[];
  lockedSlotIds: string[];
  existingAssignments?: Array<{
    slotId: string;
    candidate: ProviderAssetNormalized & { query?: string };
  }>;
}) {
  const byExisting = new Map((input.existingAssignments ?? []).map((item) => [item.slotId, item.candidate] as const));
  const locked = new Set(input.lockedSlotIds);
  const usedProviders = new Set<string>();
  const usedAuthors = new Set<string>();
  const usedIds = new Set<string>();

  const selections: SlotSelection[] = [];

  for (const slot of [...input.slotTargets].sort((a, b) => a.slotId.localeCompare(b.slotId))) {
    if (locked.has(slot.slotId) && byExisting.has(slot.slotId)) {
      const lockedCandidate = byExisting.get(slot.slotId)!;
      usedProviders.add(lockedCandidate.provider);
      usedAuthors.add(lockedCandidate.authorName);
      usedIds.add(`${lockedCandidate.provider}:${lockedCandidate.id}`);
      selections.push({
        slotId: slot.slotId,
        candidate: lockedCandidate,
        scoresConsidered: [],
        thresholdRelaxed: false
      });
      continue;
    }

    const pick = (minShortSidePx: number) => {
      const scored = input.candidates
        .filter((candidate) => !usedIds.has(`${candidate.provider}:${candidate.id}`))
        .filter((candidate) => minShortSide(candidate) >= minShortSidePx)
        .map((candidate) =>
          scoreCandidateForSlot({
            candidate: candidate as CandidateForScoring,
            slotTarget: slot,
            keywords: input.keywords,
            usedProviders,
            usedAuthors
          })
        )
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
          return `${a.candidate.provider}:${a.candidate.id}`.localeCompare(`${b.candidate.provider}:${b.candidate.id}`);
        });
      return scored;
    };

    let scored = pick(slot.minShortSidePx);
    let thresholdRelaxed = false;
    if (scored.length === 0) {
      thresholdRelaxed = true;
      scored = pick(Math.max(800, Math.floor(slot.minShortSidePx * 0.8)));
    }

    const best = scored[0] ?? null;
    if (best) {
      usedProviders.add(best.candidate.provider);
      usedAuthors.add(best.candidate.authorName);
      usedIds.add(`${best.candidate.provider}:${best.candidate.id}`);
    }

    selections.push({
      slotId: slot.slotId,
      candidate: best?.candidate ?? null,
      scoresConsidered: scored.slice(0, 5),
      thresholdRelaxed
    });
  }

  return {
    selections,
    warnings: selections
      .filter((slot) => slot.thresholdRelaxed)
      .map((slot) => ({ code: "THRESHOLD_RELAXED", slotId: slot.slotId })),
    missingSlotIds: selections.filter((slot) => !slot.candidate).map((slot) => slot.slotId)
  };
}

