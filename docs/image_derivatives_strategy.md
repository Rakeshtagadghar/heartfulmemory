# Sprint 8 Image Derivatives Strategy (v1)

## Decision

- **v1 uses original/best available asset URL for export**
- Editor preview may use lighter URLs (stock provider preview URLs or signed preview URLs)
- PDF renderer emits low-resolution warnings for print exports when source dimensions appear too small

## Why this is acceptable in v1

- Fastest path to end-to-end image pipeline
- Keeps storage/processing costs low while validating editor and export UX
- Preserves future path to generated derivatives without changing frame/asset contracts

## Planned v2 upgrade path

- Generate preview derivatives for editor canvas thumbnails/panels
- Generate print-target derivatives (or validate originals) for `HARDCOPY_PRINT_PDF`
- Store derivative metadata under the same asset with target-specific keys

## Current hooks already in place

- `packages/pdf-renderer/src/imageResolver.ts` warns for low-res images
- R2 assets carry `storageProvider` / `storageKey`
- Export route can replace asset URLs with signed R2 GET URLs before rendering
