# Sentry Release + Sourcemaps (Sprint 24)

This app uses `@sentry/nextjs` and `withSentryConfig` in `apps/web/next.config.ts`.

## Required Environment Variables

- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE` / `NEXT_PUBLIC_SENTRY_RELEASE`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## CI Integration

- Workflow: `.github/workflows/sentry-release.yml`
- Build sets `SENTRY_RELEASE=${GITHUB_SHA}`.
- Next.js Sentry plugin uploads sourcemaps during the build.
- Sourcemaps are deleted after upload (`deleteSourcemapsAfterUpload: true`).

## Vercel Setup

Set the same env vars for:

- Preview: `SENTRY_ENVIRONMENT=staging`
- Production: `SENTRY_ENVIRONMENT=production`
- `SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA`

## Validation Checklist

1. Deploy a build with `SENTRY_RELEASE` set.
2. Trigger a production error.
3. Confirm Sentry issue shows:
   - release = commit SHA
   - environment = staging/production
   - symbolicated stack traces (not minified-only).
