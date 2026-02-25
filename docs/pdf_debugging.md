# PDF Export Debugging (Sprint 16)

## Debug Mode

`POST /api/export/pdf` accepts an optional `debug` flag/object:

- `debug: true`
- or
- `debug: { showSafeArea, showBleed, showNodeBounds, showNodeIds }`

## What It Draws

- Safe area overlay
- Bleed box overlay (hardcopy mode)
- Node bounds outlines (via legacy-frame adapter for current pipeline)
- Optional node IDs

## Error Payloads

Structured error responses now include:

- `code`
- `error`
- `traceId`
- optional `details`

Validation failures return rule-engine issues and render-contract validation issues in `details`.

