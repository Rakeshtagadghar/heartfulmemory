# PDF Engine Decision (Sprint 16, v1)

## Decision

Sprint 16 uses **Playwright (HTML->PDF)** as the PDF engine for Layout export v1.

## Why Playwright

- Best short-term path to WYSIWYG parity with the Studio canvas (text wrapping, alignment, CSS-like layout).
- Already implemented in the repository (`packages/pdf-renderer/src/renderWithPlaywright.ts`).
- Lower implementation risk for Sprint 16 than rebuilding text/layout rendering in `pdf-lib`.

## Implementation Hook

- Engine selection is centralized in `packages/pdf/engine/createDocument.ts`.
- The export route now calls `createPdfDocument(...)` instead of importing Playwright directly.

## Tradeoffs (accepted for v1)

- Heavier runtime than `pdf-lib` (browser launch/memory/time).
- Serverless limits must be monitored for large exports.
- Determinism depends on controlled fonts/assets and stable HTML/CSS rendering inputs.

## Follow-up

- If serverless runtime cost becomes a blocker, keep the engine wrapper API and add a `pdf-lib` implementation behind the same interface for selected export paths.
