# Error Reference Support Flow

Sprint 24 introduces user-safe errors with support references.

## User Experience

- UI shows a friendly message, never raw stack traces.
- If available, UI also shows `Error reference: ERR-YYYYMMDD-xxxxxx`.

## How References Are Generated

- Server-side flows create a correlation id with `createCorrelationId()`.
- The id is attached to observability payloads (`extra.correlationId`).
- The same id is passed to UI state/query params (`errRef`) for user support.

## Support Triage Steps

1. Ask user for the error reference from the banner.
2. Search Sentry events for `extra.correlationId:<reference>`.
3. Confirm tags:
   - `flow`
   - `errorCode`
   - `storybookId`
   - `chapterInstanceId`
4. Use breadcrumbs to identify last key Studio/export actions.

## Current Error Surfaces

- Studio open / populate failure banner
- Draft generation/regeneration/approval error banner
- Illustration generation/replacement/lock error banner
