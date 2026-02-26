# Studio Population Contract v1 (Sprint 21)

## Scope
- Populate Studio pages for a chapter from Sprint 19 drafts + Sprint 20 illustrations.
- Keep population idempotent and compatible with the existing page/frame PDF render pipeline.

## Inputs
- `templateId`
- `chapterKey`
- Chapter template `studioPages[]` (layout + slot ids)
- Latest ready `chapterDraft` (sections, summary, quotes, entities)
- Latest ready `chapterIllustrations` (slot assignments -> cached media assets)

## Outputs
- Created/updated Studio pages and nodes (existing normalized `pages` / `frames` persistence remains source of truth)
- Per-chapter state in `chapterStudioState`
  - `status`
  - `lastAppliedDraftVersion`
  - `lastAppliedIllustrationVersion`
  - `pageIds`

## Idempotency Strategy (v1)
- Stable node ids are derived from: `chapterKey + pageTemplateId + slotId`
- Population stores applied draft/illustration versions per chapter.
- Re-running population with the same inputs must not duplicate nodes.

## Overwrite Policy (v1)
- If a populated chapter/page has user edits, population should skip overwriting edited nodes.
- "Repopulate/force overwrite" is explicitly deferred to a later sprint.

## Compatibility Constraints
- All created nodes must remain compatible with the current Layout -> PDF renderer contract.
- Image nodes must use cached asset URLs from Sprint 20 (no provider hotlinks in Studio).
