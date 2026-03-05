# DOCX Export Mapping v1

## Source: Content Model

DOCX is generated from the story content model (chapters + answers), NOT from the Studio page layout. This produces an editable, text-first Word document.

## Document Structure

```
1. Title Page
   - Story title (Heading, centered)
   - Subtitle (if present)
   - Author name (from user display_name, optional)
   - Date (export date)

2. Chapters (ordered by storybookChapters.orderIndex)
   For each chapter:
   - Chapter Heading (Heading 1): chapter title
   - Body paragraphs from answers (ordered by questionId within chapter)
     - Use answerPlain (plain text extraction) for v1 reliability
     - Skip answers where skipped=true or answerPlain is empty
   - Inline images (if storybookPhotos are mapped to this chapter)
     - Max width: 5.5 inches (fit within margins)
     - Caption below image (from asset attribution if available)

3. Credits Section (optional, final page)
   - Photo credits listing attribution for all included images
```

## Content Source Priority

For each answer:
1. `answerPlain` (plain text derived from rich text) — preferred for v1
2. `answerText` (legacy plain text) — fallback
3. Skip if both are empty/null

## Image Mapping (v1 Simple)

- Fetch `storybookPhotos` for the storybook (ordered by orderIndex)
- Spread images across chapters: assign photos to chapters round-robin
- Maximum 20 images total per document
- Images downloaded from R2 server-side and embedded as binary in DOCX

## Page Setup

- Standard Letter (8.5" x 11") for v1
- Margins: 1" top/bottom, 1" left/right
- No orientation variation for DOCX v1

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty chapter (no answers) | Include heading, skip body |
| Missing images | Skip image slot, no placeholder |
| No chapters | Title page only |
| Very long text | No truncation, Word handles pagination |
| Special characters | Escaped by docx library |

## Ordering Guarantee

1. Chapters sorted by `storybookChapters.orderIndex` ascending
2. Answers within chapter sorted by `questionId` (string sort for determinism)
3. Photos sorted by `storybookPhotos.orderIndex` ascending
