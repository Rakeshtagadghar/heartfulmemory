# Assets Linking v0 (Sprint 4)

## Scope
- Store metadata only in Convex (`assets` table)
- No binary upload/storage pipeline yet (R2 planned later sprint)

## Linkage Rules
- `storybooks.coverAssetId` references `assets._id`
- Media blocks store `content.assetId` (string Convex id)
- Blocks can exist without an asset (`TEXT`, placeholders)

## Metadata Included
- Source/provider fields (`UPLOAD`, `UNSPLASH`, etc.)
- Storage hints (`storageProvider`, `storageBucket`, `storageKey`)
- Media metadata (`mimeType`, dimensions, duration, size)
- `license` object for future stock provider ingestion
