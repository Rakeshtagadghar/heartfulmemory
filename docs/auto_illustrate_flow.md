# Auto-Illustrate Flow (Sprint 20)

## Action
- `chapterIllustrations.autoIllustrate`

## Sequence
1. Validate viewer and rate limit.
2. Load storybook, chapter, latest draft, latest illustration, and template.
3. Ensure chapter draft is `ready`.
4. Extract slot targets from template (`image1/image2/image3` fallback if needed).
5. Generate chapter theme queries/keywords (privacy-safe heuristic).
6. Create new `chapterIllustrations` version (`selecting`) unless reusing existing `ready` version.
7. Fetch provider candidates (Unsplash/Pexels), normalize, dedupe, filter by threshold/orientation.
8. Rank/select best candidates per slot (respect locks on regenerate).
9. Cache selected provider assets and create/reuse `mediaAssets`.
10. Persist slot assignments and mark illustration version `ready`.
11. On failure, return structured error and set `error` status when a version was created.

## Status Transitions
- `selecting -> ready`
- `selecting -> error`

## Idempotency
- If a `ready` illustration exists and `regenerate=false`, returns existing version.

## Notes
- Sprint 20 exposes a stable slot mapping query for Studio integration (`getByChapterInstance`).
- Studio auto-population is intentionally deferred to Sprint 21.
