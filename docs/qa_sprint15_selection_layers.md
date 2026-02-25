# Sprint 15 QA Checklist (Selection / Layers / Alignment v1)

## Selection
- Single-select each node type (text/image/shape/line/frame/group)
- Shift-click multi-select mixed node types
- Verify primary selection behavior remains stable
- Verify crop mode forces single-selection only

## Context / Actions
- Right-click node context menu opens for non-text-edit mode
- Duplicate/Delete/Lock actions apply to selected nodes
- Text edit mode keeps native text context menu

## Layers
- Bring forward / Send backward
- Bring to front / Send to back
- Verify render stacking updates immediately
- Refresh and verify ordering persists

## Alignment / Distribution
- Align to page: left/center/right/top/middle/bottom
- Align to selection: left/center/right/top/middle/bottom
- Distribute horizontal/vertical (3+ items)
- Locked nodes are skipped

## Regression
- Crop mode still enters/exits normally
- Text toolbar still behaves correctly
- Insert flows (text/image/elements) still work
