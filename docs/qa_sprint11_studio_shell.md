# Sprint 11 QA Checklist: Studio Shell v2

## Manual Checks
- Open each mini-sidebar icon and verify the correct panel appears.
- Hover across icons quickly and confirm panels do not flicker open/closed excessively.
- Move pointer from icon rail into panel; panel should remain open.
- Click icon to pin panel, then interact with canvas; panel should stay open.
- Click outside panel while unpinned; panel should close.
- Press `Escape`; panel should close.
- Use keyboard only:
  - `Tab` to mini-sidebar icon
  - `Enter` to open panel
  - `ArrowUp/ArrowDown` to move between icons
- Open/close panels while selecting/moving frames on canvas; editor interactions remain functional.
- Verify Export modal and other overlays still appear above shell panels.

## Regression Focus
- Canvas width should not shrink when opening shell panels.
- Crop mode and inline text editing should continue working.
- Uploads/Photos panel state should feel stable across panel switching (query/results preserved while mounted).

## Automation Added
- Integration test for shell panel open/close + canvas clickability:
  - `apps/web/tests/integration/studio-shell-v2.test.tsx`

