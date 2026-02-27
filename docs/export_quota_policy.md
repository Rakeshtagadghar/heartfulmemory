# Export Quota Policy (Sprint 26)

## Limits

- Free: `0` PDF exports/month
- Pro: `100` PDF exports/month

## Enforcement

- Enforcement is server-side in `POST /api/export/pdf`.
- The server checks entitlement first, then quota remaining.
- If quota is exceeded, response code is `EXPORT_QUOTA_EXCEEDED`.

## Tracking Model

- Table: `exportUsage`
- Key: `(userId, periodStart)`
- Fields:
  - `periodStart`
  - `periodEnd`
  - `countPdfExports`
  - `updatedAt`

## Period Source

1. Preferred: Stripe subscription `currentPeriodStart/currentPeriodEnd`
2. Fallback: UTC calendar month

## Increment Rules

- Increment only after successful PDF generation (or successful cached export response).
- Do not increment for `validateOnly` checks.
- Do not increment when export fails before PDF output.
