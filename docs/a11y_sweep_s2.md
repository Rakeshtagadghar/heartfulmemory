# Sprint 2 Accessibility Sweep

Date: 2026-02-24
Status: Local component sweep completed. Production Lighthouse audit pending deployment.

## Scope
- `/`
- `/pricing`
- `/gift`
- `/templates`
- Shared marketing blocks and navigation shell

## Completed Checks (Local)
- [x] Keyboard navigation for FAQ accordion (covered by integration test)
- [x] Keyboard navigation for testimonial slider (arrow keys + buttons, covered by integration test)
- [x] Mobile nav supports `aria-expanded`, `aria-controls`, `role="dialog"`, `aria-modal`, ESC close
- [x] Mobile nav focus trap implemented while drawer is open
- [x] Skip-to-content link present in marketing nav
- [x] Focus-visible styles present in shared button primitive
- [x] `prefers-reduced-motion` support maintained for landing motion helpers/hero behavior

## Notes / Fixes Applied in Sprint 2
- Replaced malformed menu and carousel glyphs with reliable SVG/text controls to avoid encoding regressions.
- Added active nav highlighting for route links and home anchors.
- Kept interactive controls keyboard-accessible across shared blocks.

## Remaining (External / Production)
- [ ] Lighthouse accessibility audit on deployed URLs
- [ ] Manual mobile screen-reader pass on production build
