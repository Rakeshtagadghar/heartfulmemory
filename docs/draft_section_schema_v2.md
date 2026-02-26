# Draft Section Schema v2 (Sprint 22)

## Purpose
- Prevent prompt/guidance leakage into user-visible draft content.
- Keep internal section writing guidance available for generation and regeneration.

## Section Shape (`chapterDrafts.sections[]`)
- `sectionId: string`
- `title: string`
- `guidance: string` (INTERNAL ONLY; never render in UI/Studio)
- `text: string` (USER VISIBLE)
- `wordCount: number`
- `citations: string[]` (questionIds only)
- `uncertain?: boolean`

## Migration Notes
- Existing drafts may not have `guidance`.
- Reader normalization should backfill `guidance` from the section framework using `(chapterKey, sectionId)`.
- Persistence should store `guidance` for all newly generated drafts.

## UI Rule
- Draft Review and Studio population must read `sections[].text` only.
- `guidance` is generation-time metadata and should never appear in user-facing output.

