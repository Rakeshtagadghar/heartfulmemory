# Email Preview Guide

## Start preview server
- Run: `pnpm email:dev`
- Open: `http://localhost:3001`
- Static logo path used in previews: `http://localhost:3001/static/branding/memorioso-email-logo.png`

## Available previews
- `VerifyEmail`
- `LoginLinkOrCode`
- `ResetPassword`
- `SubscriptionActive`
- `PaymentFailed`
- `PreviewGallery`

## Export static HTML
- Run: `pnpm email:build`
- Output: `packages/emails/dist`

## Snapshot tests
- Run: `pnpm --filter web test -- tests/emails/render-email.test.ts`
- Snapshots verify key rendered HTML output for regression detection.
