# Stripe Products and Prices (Sprint 25)

## Product Setup

Create product:
- Name: `Memorioso Pro`
- Metadata:
  - `planId=pro`
  - `app=memorioso`

Create recurring prices:
- `Pro Monthly` (recurring monthly)
- `Pro Annual` (recurring yearly, optional)

## Required Environment Variables

Server:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO_MONTHLY`
- `STRIPE_PRICE_ID_PRO_ANNUAL` (optional, can be empty if annual is disabled)

Client (only if needed for future UI enhancements):
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for hosted Checkout redirect flow)

## Checkout Metadata

When creating Checkout sessions, include metadata:
- `userId`
- `planId` (expected: `pro`)
- `app=memorioso`

## Webhook Notes

Handle at minimum:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Use event idempotency tracking (`event.id`) to avoid duplicate subscription updates.

