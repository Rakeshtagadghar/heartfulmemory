# Sprint 3 Release Checklist (Memorioso)

Date: 2026-02-24
Status: Local implementation complete. Production auth verification pending.

## Env + Supabase
- [ ] Vercel Preview/Prod envs set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Supabase auth email provider enabled
- [ ] Redirect URLs include `/auth/callback`
- [ ] SQL migrations applied (`001_profiles.sql`, `002_waitlist.sql`)
- [ ] `supabase/policies/rls_baseline.sql` applied

## Product Flow
- [ ] `/app` redirects to `/login` when signed out
- [ ] Magic link email arrives and callback succeeds
- [ ] First login creates `profiles` row
- [ ] Onboarding completion persists and routes to `/app/start`
- [ ] Logout clears session and returns to `/login`

## Security / QA
- [ ] Anon cannot read `profiles` or `waitlist`
- [ ] Waitlist form writes to Supabase (or expected fallback in preview)
- [ ] Auth analytics events visible (no email PII)
- [ ] Mobile login/onboarding UX checked
