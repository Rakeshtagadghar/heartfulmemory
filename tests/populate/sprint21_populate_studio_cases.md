# Sprint 21 Populate Studio Cases

## Scope
- Chapter population into Studio using draft + illustrations
- Idempotent rerun behavior
- Chapter navigation and routing
- Edited/finalized status progression

## Case Matrix
1. `populate_happy_path`
   - Inputs: completed chapter, ready draft, ready illustrations
   - Expect: Studio pages created/updated, `chapterStudioState.status=populated`, page route returned

2. `populate_rerun_idempotent`
   - Inputs: run populate twice without changing draft/illustration versions
   - Expect: no duplicate nodes, stable node keys reused, second run returns `reused=true`

3. `populate_skip_when_edited`
   - Inputs: chapterStudioState already `edited` with pageIds present
   - Expect: no overwrite, `skippedBecauseEdited=true`

4. `populate_missing_draft`
   - Inputs: chapter completed, draft missing/not ready
   - Expect: `DRAFT_NOT_READY`

5. `populate_missing_illustrations`
   - Inputs: draft ready, illustrations missing/not ready
   - Expect: `ILLUSTRATIONS_NOT_READY`

6. `text_slot_mapping_quote_fallback`
   - Inputs: draft with no quotes
   - Expect: quote slot filled from summary/section fallback, warning emitted

7. `image_slot_mapping_cached_url_attribution`
   - Inputs: illustration slotAssignments mapped to cached media assets
   - Expect: slot src uses cachedUrl, attribution preserved, crop defaults applied

8. `studio_nav_prev_next`
   - Inputs: storybook with multiple chapters, mixed pipeline statuses
   - Expect: prev/next links route deterministically without dead ends

9. `proceed_next_chapter_router`
   - Inputs: next chapter status variants (wizard/draft/illustrations/studio-ready)
   - Expect: Proceed CTA follows pipeline routing rules

10. `mark_finalized_promotion`
   - Inputs: populated/edited chapter in Studio
   - Expect: status promotes to `finalized` and persists after refresh

