# Sprint 20 Auto-Illustrate Test Cases

## Core Flow
- Completed chapter + ready draft -> `Auto-Illustrate` creates `chapterIllustrations` `ready` version with slot assignments.
- Re-run with `regenerate=false` -> returns existing `ready` illustration.
- Re-run with `regenerate=true` -> creates new version.

## Selection / Slot Behavior
- Locked slots persist on regenerate.
- Slot targets include deterministic fallbacks when template studio pages are missing slot metadata.
- Threshold relaxation emits warning and still fills slot when possible.

## Caching / Attribution
- Re-caching same provider asset (`provider + sourceId`) reuses existing `mediaAssets` record.
- `mediaAssets` stores attribution fields for all selected images.
- `chapterIllustrations.getByChapterInstance` returns slot map with `cachedUrl`, dimensions, attribution.

## Error Paths
- No ready draft -> `DRAFT_NOT_READY`.
- Provider fetch failure -> structured error, no crash.
- Rate limit exceeded -> friendly `RATE_LIMIT`.
- No print-safe candidates -> `NO_CANDIDATES`.
