# Selection Scoring v1 (Sprint 20)

## Candidate Score Components
- `qualityScore`: prefers higher short-side resolution and megapixels.
- `aspectScore`: penalizes aspect ratio mismatch against slot target.
- `relevanceScore`: simple keyword hits against query/attribution text.
- `diversityPenalty`: discourages repeated provider/author within the same chapter.

## Final Score
- Weighted sum:
- `quality * 0.45 + aspect * 0.35 + relevance * 0.20 - diversityPenalty`

## Selection Rules
- Process slot targets in stable `slotId` order.
- Respect locked slots (preserve assignments on regenerate).
- Use stable tie-breaking (`score`, `quality`, then `provider:id` lexical).
- If no candidate passes slot threshold, relax min short-side threshold one step and retry.

## Warnings
- Emits `THRESHOLD_RELAXED` warnings when threshold relaxation is used.
