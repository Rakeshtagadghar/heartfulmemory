# QA Checklist: Sprint 30 (Pages Scroll Modes)

Manual checks:

- Toggle `Pages` on: single-page mode is active and wheel/PageUp/PageDown navigates pages.
- Toggle `Pages` off: continuous mode shows stacked pages in one scroll container.
- Per-page chrome appears directly above each page, not in top navbar.
- Page chrome controls are not visible in print preview (`print:hidden`).
- Move up/down changes order in both modes and persists after refresh.
- Lock page blocks edit interactions until unlock.
- Hide page applies hidden overlay and excludes from export by default.
- Delete page confirms before removal and active page is reassigned safely.
- Add page after inserts directly after the source page.

Automated checks added:

- `apps/web/tests/unit/page-ops.test.ts`
- `apps/web/tests/unit/hidden-export-policy.test.ts`
- `apps/web/tests/ui/pagesModeToggle.test.tsx`
