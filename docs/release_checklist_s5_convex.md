# Release Checklist - Sprint 5 (Convex Editor v0)

## Pre-Deploy
- [ ] `pnpm --filter web lint`
- [ ] `pnpm --filter web typecheck`
- [ ] `pnpm --filter web test:unit`
- [ ] `pnpm --filter web test:integration`
- [ ] `pnpm --filter web build`
- [ ] Convex functions/schema deployed to target environment
- [ ] Vercel env vars configured for `apps/web` (`NEXTAUTH_*`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_URL`)

## Functional Verification (Preview/Prod)
- [ ] Template apply creates storybook + chapters + starter text blocks
- [ ] Dashboard `Quick Blank` creates a draft storybook
- [ ] Storybook rename persists after refresh
- [ ] Chapter add/rename/delete/reorder persists after refresh
- [ ] Text block autosave shows `Saving...` -> `Saved`
- [ ] Image placeholder block autosave persists caption/placement/size
- [ ] Conflict banner appears in two-tab edit scenario
- [ ] `Reload` / `Overwrite` conflict actions behave as expected
- [ ] Mobile chapter drawer works and editor remains usable

## Analytics Smoke
- [ ] `storybook_create_start`
- [ ] `template_view`
- [ ] `template_apply`
- [ ] `storybook_created`
- [ ] `chapter_selected`
- [ ] `block_inserted`
- [ ] `chapter_first_save`
- [ ] `storybook_rename`

## Notes / Known Sprint 5 Limits
- No file uploads yet (image placeholder only)
- No realtime collaboration
- Conflict handling is block-level last-write-wins on overwrite
- PDF export and media provider integrations are future sprints

