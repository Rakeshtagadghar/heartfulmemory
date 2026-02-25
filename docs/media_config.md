# Media Config (Sprint 10)

Media upload and photos behavior is config-driven via env vars and `apps/web/config/limits.default.json`.

## Uploads

- `MAX_UPLOAD_MB`
  - Max allowed upload size in MB (server enforced, client mirrored in UI)
- `ALLOWED_MIME_TYPES`
  - Comma-separated MIME prefixes, e.g. `image/,image/webp`
- `MAX_UPLOADS_PER_USER` (reserved)
  - Optional limit for future enforcement

## Photos Providers

- `PHOTOS_PROVIDER_ENABLED`
  - `all` | `unsplash` | `pexels`
- `PHOTOS_PER_PAGE`
  - Default results page size for Photos panel and proxy routes

## Existing R2 Limits (still active)

- `R2_FREE_TIER_HARD_STOP`
- `R2_FREE_TIER_STORAGE_BYTES_CAP`
- `R2_FREE_TIER_CLASS_A_OPS_CAP`
- `R2_FREE_TIER_CLASS_B_OPS_CAP`

## Notes

- Server-side enforcement lives in `apps/web/app/api/uploads/r2/sign/route.ts`
- Client-side mirrored hints live in Uploads/Photos panels for better UX
