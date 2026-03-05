# QA Checklist - Sprint 41 (Alpha + Sandbox Messaging)

## Landing
1. Open `/`.
2. Confirm hero shows `Early Alpha` badge above the fold.
3. Confirm short alpha blurb is visible near headline/subheadline.
4. Confirm FAQ includes:
   - `Is Memorioso in Early Alpha?`
   - `Are payments real?`

## App Shell
1. Sign in and open any `/app/*` route.
2. Confirm header shows an `Early Alpha` badge.
3. Confirm alpha banner is visible.
4. Click `Dismiss` and refresh.
5. Confirm banner stays hidden.
6. Clear localStorage key `memorioso.alpha_banner_dismissed_at` and refresh.
7. Confirm banner returns.
8. Click `What does this mean?` and confirm info modal content renders.

## Upgrade Modal (Test Mode)
1. Ensure `BILLING_MODE=test`.
2. Open any Upgrade modal entry point.
3. Confirm bold notice shows:
   - `SANDBOX / TEST MODE`
   - `No real money will be taken.`
4. Confirm test card helper shows:
   - `4242 4242 4242 4242`
   - any future expiry, any CVC, any postcode

## Upgrade Modal (Live Mode Simulation)
1. Set `BILLING_MODE=live` with valid live env values.
2. Open Upgrade modal.
3. Confirm sandbox notice + test card helper are hidden.

