# Auth + Convex Migration (Sprint 3.5)

## Chosen Strategy
- Auth.js (NextAuth) + Convex (server-side bridge via Next.js routes/actions)

## Current Local Implementation
- Auth.js v4 credentials-based developer login fallback (email-only) for local validation.
- Protected `/app/*` routes use NextAuth JWT session in middleware.
- Onboarding/profile persistence uses Convex when `CONVEX_URL` is configured, with local file fallback for development.

## Production Recommendation
- Replace credentials fallback with a real magic-link provider in Auth.js.
- Add an Auth.js -> Convex token bridge so Convex auth identity can be trusted directly in functions.
