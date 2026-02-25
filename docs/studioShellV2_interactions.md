# Studio Shell v2 Interactions

## Goals
- Keep canvas width stable while opening panels.
- Reduce sidebar clutter with an icon-only mini rail.
- Support hover, click/pin, touch, and keyboard usage.

## Interaction Rules
- Mini-sidebar is always visible on the left inside the studio viewport.
- Hovering an icon opens the matching panel after `150ms`.
- Leaving the icon/panel closes after `220ms` when panel is not pinned.
- Clicking an icon pins that panel.
- Clicking the same pinned icon closes it.
- Only one panel is open at a time.
- `Escape` closes the open panel.
- Outside click closes only when the panel is not pinned.

## Accessibility
- Mini-sidebar uses focusable buttons with labels/tooltips.
- Keyboard support:
  - `Tab` reaches icons
  - `Enter` / `Space` opens+pins panel
  - `ArrowUp` / `ArrowDown` cycles icons
  - `Home` / `End` jump to first/last icon
- Focus returns to the last remembered canvas target on close (best effort)

## Z-index
- Shell overlay (rail): `30`
- Panel overlay: `31`
- Tooltip: `32`
- Modals: `50`

## Panel Mapping (Sprint 11)
- `layouts` -> Pages / layout management
- `text` -> Text insert shortcuts
- `elements` -> Elements shortcuts (image/text entry points)
- `uploads` -> Uploads library
- `tools` -> Contextual tools registry (infrastructure)
- `photos` -> Stock photos search

