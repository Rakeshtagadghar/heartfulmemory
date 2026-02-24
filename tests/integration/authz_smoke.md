# AuthZ Smoke (Manual)

1. Visit `/app` logged out -> redirect to `/login?returnTo=...`
2. Sign in with local dev fallback
3. Complete onboarding -> `/app/start`
4. Reload and confirm state persists (Convex if configured, local fallback otherwise)
5. Submit waitlist form and confirm no regression
