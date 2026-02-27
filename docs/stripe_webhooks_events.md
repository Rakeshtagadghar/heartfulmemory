# Stripe Webhooks Events (Sprint 25)

This project consumes Stripe subscription lifecycle events at:

- `POST /api/stripe/webhook`

## Signature Verification

- Header: `stripe-signature`
- Secret: `STRIPE_WEBHOOK_SECRET`
- Verification: `stripe.webhooks.constructEvent(...)`

Requests with missing/invalid signature are rejected.

## Events Processed

- `checkout.session.completed`
  - For subscription mode, links Stripe customer to app user.
  - Fetches subscription and upserts subscription state in Convex.
- `customer.subscription.updated`
  - Upserts latest subscription status and plan metadata.
- `customer.subscription.deleted`
  - Marks subscription as canceled in Convex.
- `invoice.payment_succeeded`
  - Re-syncs subscription from Stripe to reflect recovered/active billing status.
- `invoice.payment_failed`
  - Re-syncs subscription and records failure telemetry code.

## Idempotency

Processed event IDs are stored in Convex `billingWebhookEvents`.

- Index: `by_stripeEventId`
- Duplicate deliveries return deduped success without duplicate subscription writes.

## Convex Tables Updated

- `billingCustomers`
  - User -> Stripe customer mapping.
- `billingSubscriptions`
  - Subscription status snapshot used for entitlement gating.
- `billingWebhookEvents`
  - Durable event-id dedupe ledger.

## Observability Codes

Stable codes are emitted (no raw Stripe payload logging), including:

- `BILLING_WEBHOOK_SUBSCRIPTION_ACTIVE`
- `BILLING_WEBHOOK_PAYMENT_FAILED`
- `BILLING_WEBHOOK_PROCESS_FAILED`
- `WEBHOOK_MAPPING_MISSING`
