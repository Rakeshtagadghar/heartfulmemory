# Stripe Test Pricing Setup (Sprint 26)

This project runs billing in a sandbox-safe mode with `BILLING_MODE=test` by default.

## Goal

Configure a Pro monthly test price at GBP 30 with metadata used by app logic.

## Stripe Dashboard Steps (Test Mode)

1. Enable **Test mode** in Stripe Dashboard.
2. Create or open product: `Memorioso Pro`.
3. Create recurring monthly price:
   - `currency=GBP`
   - `unit_amount=3000`
   - `interval=month`
4. Add metadata on the Product or Price:
   - `planId=pro`
   - `exportsPerMonth=100`
5. Copy the created test price id (`price_...`) into:
   - `STRIPE_PRICE_ID_PRO_TEST`

## Required Environment

- `BILLING_MODE=test`
- `STRIPE_SECRET_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET_TEST`
- `STRIPE_PRICE_ID_PRO_TEST`
- `STRIPE_CUSTOMER_PORTAL_CONFIG_ID_TEST` (optional)

## Verification

1. Run checkout from `/app/account/billing`.
2. Confirm created session line item uses `STRIPE_PRICE_ID_PRO_TEST`.
3. Complete test payment with Stripe test card.
4. Confirm webhook upserts subscription as `planId=pro`.
