# PDF Render Contract v1

`renderVersion: 1` is the versioned, pre-render validation contract for Sprint 16 PDF export.

## Purpose

- Fail fast before PDF generation.
- Make unsupported nodes/styles explicit and deterministic.
- Preserve page stacking order via `page.drawOrder`.

## Shape (summary)

- `renderVersion: 1`
- `exportTarget: "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF"`
- `storybook`
- `pages[]`
- `nodes[]`
- `assets[]`

## Supported Node Types (v1)

- `text`
- `image`
- `shape` (`rect`, `circle`)
- `line`
- `frame` (optional image fill)
- `group` (grid-style group, children rendered separately / flattened)

## Ordering

- `page.drawOrder` is canonical render order (back -> front).
- Every node on a page must appear exactly once in that page's `drawOrder`.

## Validation Outputs

- `errors`: blocking issues (unsupported node type, missing image source, invalid crop, draw order mismatch)
- `warnings`: non-blocking downgrades (font fallback, text decoration fallback)

## Current Integration

- Route preflight adapts the current legacy frame contract to `renderVersion: 1` for validation (`TEXT/IMAGE` frames).
- Validation runs before PDF generation and blocks export on contract errors.

