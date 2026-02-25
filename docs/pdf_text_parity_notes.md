# PDF Text Parity Notes (Sprint 16 v1)

## Engine Choice

Playwright HTML->PDF is used to maximize parity with Studio canvas typography in v1.

## Current Behavior

- Text is rendered into positioned HTML blocks with CSS typography.
- Wrapping and alignment rely on Chromium layout.
- Overflow is estimated in preflight/rules and warned on, not automatically resized.

## Known Gaps (v1)

- Exact letter-spacing parity can still vary by font availability.
- Deterministic font embedding is partially scaffolded (`packages/pdf/fonts/*`) but still falls back to `local()` fonts until bundled assets are committed.
- Rich text markup beyond plain text + line breaks is not guaranteed.

## Rule for Overflow

- v1 behavior: clip inside node bounds (no shrink-to-fit).

