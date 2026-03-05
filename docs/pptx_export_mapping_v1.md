# PPTX Export Mapping v1

## Source: Studio Document Model

PPTX is generated from Studio pages (pages + frames/nodes). Each page becomes one slide with positioned, editable elements.

## Page-to-Slide Mapping

```
Studio Page → PowerPoint Slide
  - Page widthPx/heightPx → slide width/height (converted to inches)
  - Background fill → slide background color
  - Each frame → slide element (text box, image, or shape)
```

## Coordinate Transform

Studio uses pixels at 96 DPI. PowerPoint uses inches.

```
inches = pixels / 96
```

For each frame:
- `x_inches = frame.x / 96`
- `y_inches = frame.y / 96`
- `w_inches = frame.w / 96`
- `h_inches = frame.h / 96`

## Frame Type Mapping

| Studio Frame Type | PPTX Element | Notes |
|-------------------|-------------|-------|
| TEXT | Text box | Position at x/y/w/h, apply font/size/color from style |
| IMAGE | Image | Embed binary, position at x/y/w/h, crop center for v1 |
| SHAPE | Rectangle shape | Position + fill color from style |
| LINE | Line shape | Start/end points derived from x/y/w/h |
| FRAME | Grouped rect | Rendered as rectangle placeholder in v1 |
| GROUP | Skip | Children rendered individually in v1 |

## Text Node Details

Content source: `frame.content.text` or `frame.content.contentRich` (Tiptap JSON)
- v1: Use plain text extraction for reliability
- Apply from `frame.style`: fontSize, fontFamily, color, bold, italic, textAlign

## Image Node Details

- Source: `frame.content.assetId` → lookup in assets table → R2 storageKey
- Download image binary from R2 server-side
- Position at frame coordinates
- Crop: v1 uses "cover center" (PptxGenJS `sizing: { type: "cover" }`)

## Page Filtering

- Hidden pages (`isHidden === true`) are excluded (matches PDF policy)
- Locked pages export normally (locked is an editing concern, not export)

## Slide Size

Derived from page dimensions + orientation:
- Portrait A4: 8.27" x 11.69"
- Landscape A4: 11.69" x 8.27"
- Portrait US Letter: 8.5" x 11"
- Landscape US Letter: 11" x 8.5"
- etc.

All slides in a deck share the same size (first page's dimensions).

## Z-Index

Frames are sorted by zIndex ascending. PptxGenJS adds elements in order, so later elements render on top.

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty page (no frames) | Blank slide with background |
| Missing image asset | Skip image, log warning |
| Text overflow | Text box sized to frame; PowerPoint auto-shrinks |
| Unsupported frame type | Skip with warning |
| Very large storybook | Process slide-by-slide to bound memory |
