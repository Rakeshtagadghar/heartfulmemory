# Asset + R2 Contract (Sprint 8 v1)

## Upload flow (current foundation)

1. Client requests `/api/uploads/r2/sign` with file metadata.
2. Server validates auth + mime + size and returns upload strategy + key.
3. Client uploads (R2 signed PUT in production, local fallback in dev).
4. Client creates asset metadata in Convex (`source=UPLOAD`).
5. Selected image frame stores `assetId` and preview/source URL in frame content.

## Asset metadata expectations

- `ownerId`
- `source`
- `storageProvider` / `storageBucket` / `storageKey` (for managed storage)
- `sourceUrl` (preview/export resolver source in v1)
- `mimeType`, `width`, `height`, `sizeBytes`
- `license` (required for stock providers)

## Stock image license snapshot (v1)

Stored in `assets.license` at selection time:

- provider
- licenseName
- licenseUrl
- requiresAttribution
- attributionText
- authorName
- authorUrl
- sourceUrl
