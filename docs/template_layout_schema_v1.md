# Template Layout Schema v1

Sprint 51 introduces canonical template-owned page layouts so Studio population, admin validation, and future export/layout-picker work can read the same geometry contract.

## Top-level fields

- `layoutSchemaVersion`: currently `1`
- `pageLayouts`: reusable page layout definitions owned by a template
- `chapterPagePlans`: ordered page-layout references for each chapter
- `defaultPageLayoutIdsByRole`: optional default layout lookup by page role
- `orientationVariants`: optional portrait/landscape alternate layout ids keyed by base layout id
- `layoutCompatibility`: optional swap groups and compatible layout ids for future layout switching

## Page layout fields

- `pageLayoutId`: stable layout identifier
- `name`: admin-facing layout label
- `pageRole`: semantic role such as `chapter_opener`, `story_page`, `gallery_page`, or `quote_page`
- `sizePreset`: one of the existing page size presets from the editor/render system
- `supportedOrientations`: `portrait`, `landscape`, or both
- `slots`: positioned slot definitions with canonical geometry

## Slot fields

- `slotId`: stable slot identifier within the page layout
- `kind`: `text`, `image`, `frame`, `shape`, `line`, or `decorative`
- `role`: semantic hint such as `title`, `body`, `quote`, or `caption`
- `bindingKey`: optional canonical content-mapping key preferred by populate/runtime flows
- `x`, `y`, `w`, `h`, `zIndex`: canonical page-space geometry
- `styleTokenRef`: optional future-facing style token reference
- `editMode`: optional editability hint: `editable`, `populate_only`, or `readonly_decorative`
- `captionSlotId`: optional linked caption slot id
- `overflowBehavior`, `maxLines`, `alignment`: text-slot-only fitting hints
- `imageFit`, `focalPoint`: image-slot-only rendering hints
- `frameType`: optional `IMAGE` or `FRAME` for image-bearing slots

## Validation rules

- `pageLayoutId` must be unique per template
- `slotId` must be unique per page layout
- `bindingKey` must be unique per page layout when present
- `w` and `h` must be positive finite numbers
- `zIndex` must be a non-negative integer
- `captionSlotId` must reference an existing slot in the same layout
- text-only fields may only appear on `text` slots
- image-only fields may only appear on `image` slots
- `chapterPagePlans` and orientation/default/compatibility references must point to known `pageLayoutId` values
- optional slot bindings can be validated against `pageLayoutId` + `slotId` and, when supplied, layout-level `bindingKey`

## Runtime notes

- Studio population now prefers `bindingKey` over `slotId` when resolving narrative/image mappings, then remaps back to stable `slotId`-based node provenance.
- Concrete pages still pin `pageLayoutId`, template provenance, and `layoutFingerprint` so later template edits do not silently reflow historical books.

## Minimal example

```json
{
  "layoutSchemaVersion": 1,
  "pageLayouts": [
    {
      "pageLayoutId": "chapter_main_v1",
      "name": "Chapter Main",
      "pageRole": "story_page",
      "sizePreset": "BOOK_8_5X11",
      "supportedOrientations": ["portrait"],
      "slots": [
        { "slotId": "title", "kind": "text", "role": "title", "bindingKey": "chapterTitle", "x": 60, "y": 64, "w": 696, "h": 72, "zIndex": 1, "overflowBehavior": "shrink_to_fit", "maxLines": 2, "alignment": "center" },
        { "slotId": "image1", "kind": "image", "role": "image", "bindingKey": "primaryImage", "x": 60, "y": 156, "w": 470, "h": 320, "zIndex": 2, "imageFit": "cover" },
        { "slotId": "body", "kind": "text", "role": "body", "bindingKey": "chapterBody", "x": 552, "y": 156, "w": 204, "h": 320, "zIndex": 3, "overflowBehavior": "shrink_to_fit" }
      ]
    }
  ],
  "chapterPagePlans": [
    {
      "chapterKey": "ch_origins",
      "pages": [{ "pageLayoutId": "chapter_main_v1", "pageRole": "story_page" }]
    }
  ]
}
```
