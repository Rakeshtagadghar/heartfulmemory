# Set Password Policy (Sprint 38)

## Goal
Add a gentle account-security upgrade path for users who signed in with Google or email link and do not have a password yet.

## Single Source of Truth
- Config: `apps/web/lib/config/setPasswordPolicy.ts`
- Redirect resolver: `apps/web/lib/auth/postLoginRedirect.ts`
- Route guards: `apps/web/middleware/routeGuards.ts`

## v1 Decisions
- Prompt after passwordless login: `enabled`
- Skip allowed: `yes`
- Skip window: `30 days`
- Required gate for sensitive routes:
  - Export APIs: `enabled`
  - Billing: `disabled` (can be enabled later)

## Behavior
1. User logs in successfully.
2. System checks `hasPassword`.
3. If `hasPassword=false` and policy says prompt, user is routed to `/account/set-password?returnTo=...`.
4. User can:
   - Set password: `hasPassword` becomes true, then redirect to `returnTo`.
   - Skip for now: store skip cookie and redirect to `returnTo`.

## Loop Protection
- Do not re-route when destination is already `/account/set-password`.
- Do not re-route when destination is `/auth/post-login`.

## Skip/Complete Semantics
- Skip: temporary deferral only, tracked by cookie `memorioso_set_password_skip_until`.
- Complete: persistent completion, tracked by user profile metadata `hasPassword=true`.

