# Sprint 12 QA: Text System v1

## Manual Checklist

- Insert `Heading`, `Subheading`, and `Body` from the Text panel.
- Confirm inserted text is selected and enters edit mode.
- Type text, paste plain text, and exit edit mode by clicking outside.
- Open floating toolbar on text selection (not shown for image selection).
- Change font, size, weight, italic, underline, color, alignment, line height, and letter spacing.
- Confirm changes reflect immediately on canvas and persist after refresh.
- Use text quick actions:
  - duplicate
  - delete
  - lock/unlock
  - bring forward / send backward
- Right-click on a text box to open the context menu and execute actions.
- Keyboard shortcuts on selected text node (not editing):
  - `Delete` / `Backspace`
  - `Ctrl/Cmd+C`
  - `Ctrl/Cmd+V`
  - `Ctrl/Cmd+D`
- Keyboard shortcuts while editing text:
  - `Ctrl/Cmd+C` copies selected text, not node
  - `Ctrl/Cmd+V` pastes plain text into textarea
- Locked text box cannot be moved, resized, edited, or deleted until unlocked.

## Regression Checks

- Selecting image frames hides the floating text toolbar.
- Dragging/resizing non-text frames still works.
- Crop mode still works for image frames.
- Studio shell hover/pin panels continue to open/close correctly.

## Notes

- Undo/redo is only verified if the current editor stack exposes undo/redo for frame/content edits.
- Font list is MVP (web-safe defaults) and opens via the floating toolbar font control.
