# Pricing and Entitlements v1 (Sprint 25)

## Plans

### Free
- Features:
  - Create storybooks
  - Generate drafts
  - Studio editing
- Limits:
  - `exportsPerMonth = 0`
  - `canExportDigital = false`
  - `canExportHardcopy = false`

### Pro
- Features:
  - Digital PDF export
  - Hardcopy PDF export
  - Higher monthly limits
- Limits:
  - `exportsPerMonth = 50`
  - `canExportDigital = true`
  - `canExportHardcopy = true`

## Entitlement Object

Resolved entitlements are represented as:

```ts
{
  planId: "free" | "pro";
  subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
  canExportDigital: boolean;
  canExportHardcopy: boolean;
  exportsRemaining: number | null;
}
```

## Status Mapping Rules

- `active`, `trialing`:
  - Pro entitlements enabled.
- `past_due`:
  - Pro entitlements enabled only if within optional grace window.
- `canceled`, `unpaid`, `incomplete`, `none`:
  - Premium entitlements disabled.

## Notes

- Stripe webhook-confirmed subscription state is the source of truth.
- Client-side checks are UX only; server-side export endpoints must enforce entitlements.
- `exportsRemaining` is computed from plan monthly limit minus usage for current month.

