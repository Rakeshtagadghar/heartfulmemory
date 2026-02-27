# QA Checklist - Sprint 24 (Sentry)

## Preconditions

- Staging deploy has:
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT=staging`
  - `SENTRY_RELEASE=<commit_sha>`
- Build completed with sourcemap upload enabled.

## Manual Smoke Tests

1. Client capture
   - Open Studio and force a client error in browser devtools.
   - Verify event in Sentry with tags: `flow`, `feature`, `runtime=client`.

2. Server capture
   - Trigger export failure path (`/api/export/pdf`) with invalid payload.
   - Verify event shows `flow=export_pdf_post` and `runtime=server`.

3. Convex capture
   - Trigger STT or draft generation failure case.
   - Verify event tags include `errorCode` and chapter metadata.

4. Redaction verification
   - Inspect event payload.
   - Confirm no raw transcript/story/prompt text appears.

5. Studio breadcrumbs
   - Perform: open, select frame, crop enter/apply, insert media, export click.
   - Trigger an error and verify last milestones appear in breadcrumbs.

6. Release + sourcemaps
   - Verify event has correct `release` and `environment`.
   - Confirm stack trace is symbolicated.

## Automated Tests

- `apps/web/tests/observability/redact.test.ts`
- `apps/web/tests/observability/capture.test.ts`

Run:

```bash
pnpm --filter web test -- tests/observability/redact.test.ts tests/observability/capture.test.ts
pnpm --filter web typecheck
```
