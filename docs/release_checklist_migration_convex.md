# Convex Migration Release Checklist (Sprint 3.5)

## Environment
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXT_PUBLIC_CONVEX_URL`
- [ ] Convex deployment created
- [ ] Auth.js provider secrets configured (if replacing dev credentials fallback)

## Smoke Tests
- [ ] Login works
- [ ] `/app/*` protected routes redirect correctly
- [ ] Onboarding persists in Convex `users`
- [ ] Waitlist writes to Convex `waitlist`
- [ ] Logout returns to `/login`
