# QA Checklist: Sprint 16 PDF Export

## Automated

- Contract validation deterministic ordering (`validateRenderable`)
- Layout coordinate mapping (`pagePresets`, `coordinateSystem`)
- HTML page rendering for supported node types (text/image/shape/line/frame)
- (Optional) Playwright PDF generation integration test

## Manual Visual QA

1. Compare Studio canvas vs PDF export for at least 3 documents.
2. Verify text wrapping/alignment on text-heavy pages.
3. Verify image crop/focal point on framed images.
4. Verify layer order after bring-to-front/send-to-back operations.
5. Verify hardcopy safe-area and bleed overlays using debug mode.
6. Verify validation blocks unsupported/malformed exports with actionable errors.

