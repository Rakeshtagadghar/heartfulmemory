# Single Page Scroll Rules

Mode behavior:

- `single_page` renders one active page at a time.
- Wheel/trackpad vertical scroll moves to previous/next page after threshold crossing.
- Navigation has a cooldown to prevent rapid accidental flips.

Interception guardrails:

- Scroll navigation is ignored while focus is in editable text controls (`textarea`, text `input`, `contenteditable`).
- `PageUp` and `PageDown` navigate pages in single-page mode.

Selection behavior:

- Switching page via scroll clears active frame selection to avoid cross-page selection bugs.
