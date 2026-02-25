# Sprint 8 R2 Setup (Images v1)

## Required env vars

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL` (optional if using public read path/proxy)
- `R2_UPLOAD_MAX_MB` (optional, default 10)
- `R2_FREE_TIER_HARD_STOP` (default `true`)
- `R2_FREE_TIER_STORAGE_BYTES_CAP` (default `10737418240` = 10GB)
- `R2_FREE_TIER_CLASS_A_OPS_CAP` (default `1000000`)
- `R2_FREE_TIER_CLASS_B_OPS_CAP` (default `10000000`)

## Bucket strategy (recommended)

- Bucket: `memorioso-assets`
- Key layout: `userId/storybookId/yyyy/mm/dd/uuid.ext`
- Keep bucket private by default
- Use signed URLs for upload/view/export in production

## CORS (minimum)

- Allowed origins: local dev + preview + prod domains
- Methods: `PUT`, `GET`, `HEAD`
- Headers: `Content-Type`, `Content-Length`, `x-amz-*`

## Current implementation status

- Sprint 8 implementation includes real upload signing (presigned PUT) when R2 env vars are configured.
- Local dev fallback uploader is enabled when R2 env vars are not configured.
- Hard-stop free-tier quota guard is enforced server-side before R2 uploads and before R2 reads for preview/export.

## Free-tier hard stop behavior (safety-first)

- Monthly counters are tracked in Convex (`r2UsageMonthly`) for:
  - reserved storage bytes (conservative)
  - Class A operations
  - Class B operations
- Upload signing refuses new uploads if the next upload would exceed:
  - 10GB storage cap
  - 1M Class A cap
- Asset preview/export URL signing reserves Class B ops and refuses if it would exceed:
  - 10M Class B cap
- Storage tracking is **conservative**: upload quota is reserved at sign-time (even if a client abandons the upload). This guarantees the app stays under the configured free-tier budget.
