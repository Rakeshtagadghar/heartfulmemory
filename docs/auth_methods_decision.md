# Sprint 36 Auth Method Decision

## Decision Summary
- Primary auth backend: Convex Auth (migration target for Sprint 36).
- Enabled methods:
  - `password` (with email verification support).
  - `email OTP` as the default email-first method for elders.
  - `magic link` kept optional/toggleable.
  - `google OAuth` for low-friction sign-in.

## Why This Mix
- Password supports familiar behavior for many users.
- OTP gives a clearer UX than long magic-link flows for less technical users.
- Magic link remains available for users who prefer inbox-only login.
- Google OAuth reduces account creation friction.

## UX Rules (applied across auth screens)
- Single-column forms, large inputs, large tap targets.
- Plain language CTAs: `Send code`, `Continue`, `Sign in with Google`.
- Anti-enumeration messaging on reset/sign-in attempts:
  - Always return neutral success copy for unknown emails.

## Data Contract Choices
- Keep existing `users.authSubject` for continuity during migration.
- Add Sprint 36 auth profile fields on `users`:
  - `primaryEmail`
  - `emailVerifiedAt`
  - `authProvidersLinked`
- Add Sprint 37-compatible placeholders now:
  - `deletionStatus`
  - `deletionRequestedAt`
  - `purgeAt`
  - `lastActivityAt`

## Migration Notes
- Current production runtime still uses NextAuth session cookies.
- Sprint 36 phase 2 will wire Convex Auth providers and callbacks.
- Guard abstraction is introduced in `apps/web/lib/auth/requireUser.ts` so route checks can switch auth backends with minimal app-page churn.

