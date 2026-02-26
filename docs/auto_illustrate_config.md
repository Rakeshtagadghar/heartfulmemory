# Auto-Illustrate Config (Sprint 20)

## Server / Convex env
- `AUTOILLUSTRATE_MIN_SHORTSIDE_FULLPAGE=2600`
- `AUTOILLUSTRATE_MIN_SHORTSIDE_LARGE=1800`
- `AUTOILLUSTRATE_MIN_SHORTSIDE_SMALL=1000`
- `AUTOILLUSTRATE_PROVIDER_MODE_DEFAULT=both`
- `AUTOILLUSTRATE_MAX_CANDIDATES_PER_SLOT=24`
- `AUTOILLUSTRATE_MAX_DOWNLOAD_MB=15`
- `AUTOILLUSTRATE_RATE_LIMIT_PER_USER=12`

## What They Control
- Resolution thresholds: print-safety filtering per slot size class.
- Provider mode: default source (`unsplash`, `pexels`, `both`).
- Candidate cap: limits provider fetch volume per slot.
- Download cap: max file size for provider caching.
- Rate limit: per-user orchestration throttling.

## Enforcement
- All limits are enforced server-side in Convex actions.
- Selection may return warnings when thresholds are relaxed to fill a slot.
