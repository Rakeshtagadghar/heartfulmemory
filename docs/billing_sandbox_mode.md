# Billing Sandbox Mode (Sprint 26)

This app supports a safe Stripe sandbox path in production-like environments.

## Mode Switch

Set:

- `BILLING_MODE=test` to force Stripe Test Mode
- `BILLING_MODE=live` to use live billing credentials

Default behavior is `test` when unset.

## Required Variables

### When `BILLING_MODE=test`

- `STRIPE_SECRET_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET_TEST`
- `STRIPE_PRICE_ID_PRO_TEST`
- `STRIPE_CUSTOMER_PORTAL_CONFIG_ID_TEST` (optional)

### When `BILLING_MODE=live`

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- At least one of:
  - `STRIPE_PRICE_ID_PRO_MONTHLY`
  - `STRIPE_PRICE_ID_PRO_ANNUAL`
- `STRIPE_CUSTOMER_PORTAL_CONFIG_ID` (optional)

## Guardrails

The runtime config validator blocks billing endpoints when mode/env are mixed or incomplete.

Examples of blocked states:

- `BILLING_MODE=test` with only live key configured
- `BILLING_MODE=test` and `STRIPE_SECRET_KEY_TEST` starts with `sk_live_`
- `BILLING_MODE=live` and `STRIPE_SECRET_KEY` starts with `sk_test_`

## Affected Endpoints

- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/stripe/webhook`

All three select Stripe client + webhook secret based on `BILLING_MODE`.
