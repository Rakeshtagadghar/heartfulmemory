# QA Checklist - Sprint 25 (Stripe Billing + Export Paywall)

## Preconditions

- Stripe configured in environment:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_PRO_MONTHLY`
  - `STRIPE_PRICE_ID_PRO_ANNUAL` (optional)
- Billing guard enabled:
  - `BILLING_ENFORCE_EXPORT_GATING=true`
- Webhook endpoint configured in Stripe dashboard:
  - `/api/stripe/webhook`

## Manual Checklist

1. Free user export intent
- Open Studio as Free user.
- Click export button.
- Verify crown CTA opens upgrade modal (not export modal).

2. Checkout upgrade flow
- From upgrade modal, click `Upgrade with Stripe`.
- Verify redirect to Stripe Checkout.
- Complete payment.
- Verify `/billing/success` appears and status transitions to active.

3. Pro export flow
- Return to Studio.
- Export button should open export modal directly.
- Run checks and download PDF.

4. Cancel flow
- Start checkout and cancel.
- Verify `/billing/cancel` page and no entitlement upgrade.

5. Customer portal
- Open `/app/account/billing`.
- Click `Manage Billing`.
- Verify Stripe portal opens for current user.

6. Downgrade and payment-failed policy
- Cancel subscription in portal or simulate failed invoice in Stripe test mode.
- Deliver webhook.
- Verify entitlements downgrade per rules.

7. Webhook duplicate delivery
- Replay the same Stripe event ID.
- Verify no duplicate billing rows and stable success response.

## Automated Tests

- `apps/web/tests/billing/entitlements.test.ts`
- `apps/web/tests/billing/webhook_idempotency.test.ts`
- `apps/web/tests/ui/exportPaywall.test.tsx`

Run:

```bash
pnpm --filter web test -- tests/billing/entitlements.test.ts tests/billing/webhook_idempotency.test.ts tests/ui/exportPaywall.test.tsx
pnpm typecheck
pnpm lint
```
