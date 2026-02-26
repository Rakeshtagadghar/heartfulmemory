# Sprint 20 Slot Target Extraction Rules

Source: `packages/shared/templates/slotTargets.ts`

## Inputs

- `templateJson`
- `chapterKey`
- optional `studioPages[].slots[]` metadata (when available)

## Output

- `slotTargets[]`
  - `slotId`
  - `aspectTarget`
  - `orientation`
  - `minShortSidePx`

## Rules

1. If `studioPages` metadata exists for the chapter, extract all image slots from matching pages.
2. Image slot detection checks `kind/type/role/slotId/id` fields for `"image"`.
3. If aspect ratio metadata is missing, fallback per slot:
   - `image1` -> `4:3`
   - `image2` -> `1:1`
   - `image3` -> `3:4`
4. `minShortSidePx` fallback by size class:
   - `cover` -> `2600`
   - `large` -> `1800`
   - `medium` -> `1400`
   - `small` -> `1000`
5. If no slot metadata exists, return deterministic fallback targets for `image1/image2/image3`.
