# Sprint 21 QA: Chapter -> Studio Populate v1

## Goal
- Verify chapter draft + illustration outputs populate Studio pages deterministically.
- Verify idempotent reruns (no duplicate nodes).
- Verify chapter navigation and status progression (`populated -> edited -> finalized`).

## Preconditions
- Convex deployment configured and reachable.
- Sprint 19 draft generation works for the target chapter.
- Sprint 20 auto-illustrate produces ready `chapterIllustrations`.
- At least 2 guided chapters exist in the storybook for prev/next navigation checks.

## Manual Checklist
1. Complete a chapter wizard and ensure status is `completed`.
2. Generate a chapter draft and confirm latest draft status is `ready`.
3. Auto-illustrate the chapter and confirm latest illustration status is `ready`.
4. From `/book/{storybookId}/chapters`, click `Open in Studio`.
5. Confirm progress UI shows a preparation state and routes to Studio.
6. Confirm Studio page(s) are created for the chapter and text/image slots are populated.
7. Confirm image frames use cached URLs (not provider raw URLs) and attribution metadata persists after refresh.
8. Close Studio and click `Open in Studio` again for the same chapter.
9. Confirm no duplicate populated nodes are created (stable node mapping/idempotent rerun).
10. Edit a populated text/image node, save/autosave, refresh Studio, and confirm chapter status shows `Edited`.
11. Use `Prev` / `Next` chapter navigation inside Studio; confirm routing follows chapter pipeline state.
12. Click `Mark Chapter as Laid Out`; confirm status changes to `Finalized`.
13. Use `Proceed to Next Chapter`; verify routing goes to wizard/draft/illustrations/studio depending on next chapter state.
14. Export PDF and verify populated content renders correctly (no layout/PDF regressions).

## Failure / Retry Checks
- Force a failure path (e.g., missing ready draft or ready illustrations) and confirm:
  - clear error UI appears
  - `Retry` is available
  - `Back to Chapters` is available

## Analytics Smoke Checks
- `populate_chapter_start`
- `populate_chapter_success`
- `populate_chapter_error`
- `studio_chapter_nav_prev`
- `studio_chapter_nav_next`
- `chapter_mark_finalized`

