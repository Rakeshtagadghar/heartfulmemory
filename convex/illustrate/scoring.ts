import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";
import type { SlotTarget } from "../../packages/shared/illustrations/illustrationTypes";

export type CandidateForScoring = ProviderAssetNormalized & {
  query?: string;
};

export type ScoredCandidate = {
  candidate: CandidateForScoring;
  score: number;
  qualityScore: number;
  aspectScore: number;
  relevanceScore: number;
  diversityPenalty: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function candidateAspect(candidate: CandidateForScoring) {
  if (!candidate.width || !candidate.height || candidate.width <= 0 || candidate.height <= 0) return null;
  return candidate.width / candidate.height;
}

function qualityScore(candidate: CandidateForScoring) {
  if (!candidate.width || !candidate.height) return 0.45;
  const shortSide = Math.min(candidate.width, candidate.height);
  const megapixels = (candidate.width * candidate.height) / 1_000_000;
  const shortSideNorm = clamp01((shortSide - 800) / 2200);
  const mpNorm = clamp01((megapixels - 1) / 11);
  return shortSideNorm * 0.65 + mpNorm * 0.35;
}

function aspectScore(candidate: CandidateForScoring, target: SlotTarget) {
  const ar = candidateAspect(candidate);
  if (!ar) return 0.4;
  const diff = Math.abs(ar - target.aspectTarget);
  return clamp01(1 - diff / Math.max(0.35, target.aspectTarget));
}

function relevanceScore(candidate: CandidateForScoring, keywords: string[]) {
  const haystack = `${candidate.query ?? ""} ${candidate.attributionText ?? ""}`.toLowerCase();
  if (!keywords.length) return 0.5;
  let hits = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) hits += 1;
  }
  return clamp01(hits / Math.max(1, Math.min(8, keywords.length)));
}

function diversityPenalty(candidate: CandidateForScoring, used: { providers: Set<string>; authors: Set<string> }) {
  let penalty = 0;
  if (used.providers.has(candidate.provider)) penalty += 0.08;
  if (used.authors.has(candidate.authorName)) penalty += 0.15;
  return penalty;
}

export function scoreCandidateForSlot(input: {
  candidate: CandidateForScoring;
  slotTarget: SlotTarget;
  keywords: string[];
  usedProviders: Set<string>;
  usedAuthors: Set<string>;
}) : ScoredCandidate {
  const q = qualityScore(input.candidate);
  const a = aspectScore(input.candidate, input.slotTarget);
  const r = relevanceScore(input.candidate, input.keywords);
  const d = diversityPenalty(input.candidate, { providers: input.usedProviders, authors: input.usedAuthors });
  const score = q * 0.45 + a * 0.35 + r * 0.2 - d;
  return {
    candidate: input.candidate,
    score,
    qualityScore: q,
    aspectScore: a,
    relevanceScore: r,
    diversityPenalty: d
  };
}

