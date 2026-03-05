# Export Architecture v2 (Sprint 39)

## Overview

Sprint 39 adds DOCX and PPTX export alongside existing PDF. All three share a unified export quota and artifact storage pipeline.

## Export Types

| Type | Source Model | Output | Tooling |
|------|-------------|--------|---------|
| PDF  | Studio doc (pages + frames) | Pixel-perfect PDF | Playwright HTML→PDF |
| DOCX | Content model (chapters + answers) | Editable Word doc | `docx` npm package |
| PPTX | Studio doc (pages + frames) | Editable slide deck | `pptxgenjs` |

## New Tables

### `exportJobs`
Tracks the lifecycle of each export request.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Auth subject |
| storybookId | id("storybooks") | Target storybook |
| type | "pdf" \| "docx" \| "pptx" | Export format |
| status | "queued" \| "running" \| "done" \| "error" | Job state |
| artifactId | id("exportArtifacts") \| null | Link to artifact on success |
| errorCode | string \| null | Stable error code |
| errorMessage | string \| null | Human-readable error |
| createdAt / updatedAt | number | Timestamps |

Indexes: `by_userId`, `by_storybookId`, `by_storybookId_createdAt`

### `exportArtifacts`
Records for files stored in R2.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Auth subject |
| storybookId | id("storybooks") | Target storybook |
| jobId | id("exportJobs") | Originating job |
| type | "pdf" \| "docx" \| "pptx" | Format |
| filename | string | Download filename |
| r2Key | string | R2 object key |
| mimeType | string | MIME type |
| sizeBytes | number | File size |
| createdAt | number | Timestamp |

Indexes: `by_userId`, `by_storybookId`, `by_jobId`

### `exportUsage` (updated)
Added `countExports` (optional number) as a unified counter alongside legacy `countPdfExports`.

### `exports` (updated)
`exportTarget` union expanded: `"DIGITAL_PDF" | "HARDCOPY_PRINT_PDF" | "DOCX" | "PPTX"`

## Unified Quota

- One monthly counter (`countExports`) incremented for PDF, DOCX, and PPTX.
- Check quota before job enqueue; increment only on successful completion.
- Backward compatible: reads `countExports ?? countPdfExports` for migration period.

## Job Lifecycle

```
requestExport(type, storybookId)
  → check auth + entitlements + unified quota
  → insert exportJobs { status: "queued" }
  → run generator (DOCX/PPTX/PDF)
  → upload Buffer to R2
  → insert exportArtifacts record
  → patch exportJobs { status: "done", artifactId }
  → increment unified usage
  → return signed download URL
```

On error: patch `exportJobs { status: "error", errorCode, errorMessage }`.

## R2 Key Convention

```
exports/{storybookId}/{type}/{jobId}.{ext}
```

- PDF: `.pdf` (existing convention preserved)
- DOCX: `.docx`
- PPTX: `.pptx`

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/export/pdf` | POST | Existing PDF export |
| `/api/export/docx` | POST | New DOCX export |
| `/api/export/pptx` | POST | New PPTX export |
| `/api/export/jobs/[jobId]` | GET | Poll job status |
| `/api/export/artifacts/[artifactId]` | GET | Download artifact (signed URL redirect) |

## MIME Types

- PDF: `application/pdf`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- PPTX: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
