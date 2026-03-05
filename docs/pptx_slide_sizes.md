# PPTX Slide Sizes

## Conversion

Studio pages use pixels at 96 DPI. PowerPoint uses inches.

```
slide_width_inches  = page.widthPx / 96
slide_height_inches = page.heightPx / 96
```

## Standard Presets

| Preset | Orientation | Width (px) | Height (px) | Width (in) | Height (in) |
|--------|------------|------------|-------------|------------|-------------|
| A4 | Portrait | 794 | 1123 | 8.27 | 11.70 |
| A4 | Landscape | 1123 | 794 | 11.70 | 8.27 |
| US_LETTER | Portrait | 816 | 1056 | 8.50 | 11.00 |
| US_LETTER | Landscape | 1056 | 816 | 11.00 | 8.50 |
| BOOK_6X9 | Portrait | 720 | 1080 | 7.50 | 11.25 |
| BOOK_6X9 | Landscape | 1080 | 720 | 11.25 | 7.50 |
| BOOK_8_5X11 | Portrait | 816 | 1056 | 8.50 | 11.00 |
| BOOK_8_5X11 | Landscape | 1056 | 816 | 11.00 | 8.50 |

## PptxGenJS Configuration

```typescript
const pptx = new PptxGenJS();
pptx.defineLayout({
  name: "CUSTOM",
  width: slideWidthInches,
  height: slideHeightInches
});
pptx.layout = "CUSTOM";
```
