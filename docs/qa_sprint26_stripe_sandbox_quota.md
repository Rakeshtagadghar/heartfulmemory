# QA Checklist: Sprint 26 (Stripe Sandbox + Quota)

## Environment

- `BILLING_MODE=test`
- Stripe test secrets and test price configured
- `BILLING_ENFORCE_EXPORT_GATING=true`

## Manual Checks

1. Billing sandbox guardrails
   - With mixed/missing test env vars, checkout/portal/webhook endpoints return config error.
2. Upgrade flow in test mode
   - Free user can open checkout and complete test payment.
   - Webhook updates subscription to Pro.
3. Quota enforcement
   - Pro user exports succeed until quota is exhausted.
   - Next export returns `EXPORT_QUOTA_EXCEEDED`.
4. Plan banner
   - Free: shows Upgrade CTA.
   - Pro: shows remaining exports + Manage Billing + Invoices link.
5. Invoices page
   - Pro: opens Stripe portal to invoices.
   - Free: shows empty state + upgrade CTA.
6. Landing pricing copy
   - Shows GBP 30/month and 100 PDF/month claims.
   - `Start free` and `Upgrade to export` CTAs route correctly.

## Regression Checks

- Preview and preflight still function.
- Export usage increments only on successful non-preview export response.
- No Stripe secret appears in client bundle or browser logs.
