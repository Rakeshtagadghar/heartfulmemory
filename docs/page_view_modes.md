# Page View Modes (Sprint 30 v1)

Studio now tracks a `pageViewMode` with two values:

- `single_page`: focus mode for editing one page at a time.
- `continuous`: browsing mode (used as non-focused state in the current UX pass).

Persistence contract:

- Stored in `localStorage` per storybook key: `memorioso:studio:page-view-mode:{storybookId}`.
- Mirrored into `storybook.settings.studioDocMeta.pageViewMode` for backend persistence.

Current toggle behavior:

- The header `Pages` toggle switches between modes.
- `single_page` pins/opens the Pages panel.
- `continuous` closes the Pages panel when it is active.
