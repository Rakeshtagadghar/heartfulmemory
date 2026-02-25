# Sprint 14 QA Checklist (Crop Mode v1)

## Core Flows

- Insert/upload an image and double-click it to enter crop mode.
- Insert a frame placeholder, fill it with an image, and double-click to enter crop mode.
- Confirm the `Crop` sidebar opens in Studio Shell v2 (left panel), not the top navbar.
- Confirm `Done` applies the crop and exits crop mode.
- Confirm `Cancel` exits crop mode and discards changes.
- Confirm `Escape` exits crop mode safely.

## Crop Interactions

- Drag inside crop mode to pan the image focal point.
- Drag crop corners and edges to resize the crop rectangle.
- Verify crop rectangle cannot be dragged outside image bounds.
- Verify crop rectangle respects a minimum size.
- Use zoom slider and confirm image updates live.
- Use rotate `-90/+90` and confirm image updates live.
- Click `Reset Crop` and verify crop returns to defaults.

## Persistence / Regression

- Apply crop, refresh page, and confirm crop persists identically.
- Cancel crop, refresh page, and confirm original image rendering is unchanged.
- After exiting crop mode, normal move/resize/select behavior still works for image and frame nodes.
- Verify double-click text edit still works for text nodes (no crop-mode conflict).

## Notes

- If rendering differs after refresh/export, capture frame type (`IMAGE` vs `FRAME`) and crop payload.
- Record any pointer conflicts with canvas panning/selection during crop mode.
