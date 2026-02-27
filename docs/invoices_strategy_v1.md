# Invoices Strategy v1 (Sprint 26)

## Decision

Use Stripe Customer Portal as the invoice source of truth.

## Why

- Fast to ship with low maintenance.
- Stripe handles invoice rendering, receipts, tax fields, and payment method updates.
- Avoids exposing Stripe secrets client-side.

## UX

- Route: `/app/account/invoices`
- Pro users:
  - See plan + billing status summary.
  - Open Stripe portal via `ManageBillingButton` and view invoices there.
- Free users:
  - See empty state.
  - See upgrade CTA to `/app/account/billing?intent=upgrade`.

## Future (v2)

- Optional server-side invoice list (`stripe.invoices.list`) with local caching.
- Add in-app invoice table and direct hosted-invoice links.
