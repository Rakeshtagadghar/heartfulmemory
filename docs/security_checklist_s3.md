# Sprint 3 Security Checklist

Status: Local implementation complete. Production verification pending.

## Implemented
- [x] Supabase public/server/admin client separation
- [x] Protected `/app/*` routes redirect unauthenticated users to `/login?returnTo=...`
- [x] Service role usage isolated to server-only waitlist route path
- [x] Baseline RLS SQL for `profiles` and `waitlist`
- [x] Waitlist endpoint keeps honeypot + rate limiting + server-side email validation

## Verify in Supabase / Production
- [ ] RLS enabled on `profiles`
- [ ] RLS enabled on `waitlist`
- [ ] Anon cannot `select` from `profiles` or `waitlist`
- [ ] Authenticated user can only read/update own `profiles` row
- [ ] Service role key is not present in browser bundles/network responses
