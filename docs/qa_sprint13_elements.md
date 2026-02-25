# Sprint 13 QA Checklist: Elements v1

## Core Insert Flows
- Insert `Rectangle`, `Circle`, `Line`, `Frame`, `Grid 2-col`, `Grid 3-col`, `Grid 2x2` from Elements panel.
- Confirm inserted element is selected immediately.
- Refresh page and verify inserted elements persist.

## Selection / Transform
- Move each element type.
- Resize each element type using handles.
- Verify line uses bounding-box resize (MVP behavior).
- Lock each type and verify move/resize is blocked.

## Frames + Media Fill
- Insert a `Frame` placeholder.
- Select frame and use `Fill With Image` / Uploads panel click to replace.
- Select frame and use Photos panel click to replace.
- Drag an uploaded image card onto a frame and verify it fills the frame.
- Drag a photo result card onto a frame and verify it fills the frame.

## Context Menus
- Right-click on `SHAPE`, `LINE`, `FRAME`, and `GROUP` elements.
- Verify menu shows duplicate/delete/lock and layer ops.
- Verify `Replace image` appears for `FRAME` only.

## Styles
- For `SHAPE` / `FRAME`: change fill, stroke, strokeWidth, radius.
- For `LINE`: change stroke and strokeWidth.
- For `GROUP` grid helper: update fill/stroke values and verify visual changes.
- Refresh and confirm styles persist.

## Regression Checks (S10-S12)
- Text frame selection/edit still works.
- Floating text toolbar still appears and closes correctly.
- Image crop mode for `IMAGE` frames still works.
- Export modal still opens and runs checks.

## Stress
- Insert 30+ mixed elements and verify editor remains responsive (select/move/resize without major jank).

