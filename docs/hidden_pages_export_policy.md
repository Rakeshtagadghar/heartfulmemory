# Hidden Pages Export Policy

Default behavior:

- Hidden pages are excluded from PDF export.

Configuration:

- Set `EXPORT_INCLUDE_HIDDEN_PAGES=true` to include hidden pages in export output.

Implementation:

- Hidden flags are read from page model field `pages.isHidden` (serialized as `is_hidden` in DTO payload).
- Export filtering happens before hash computation and render-contract generation.
- Filter helper: `packages/pdf/renderers/filterPages.ts`.
