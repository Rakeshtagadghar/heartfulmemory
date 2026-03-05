# Google Account Chooser UX (Sprint 38)

## Route
- `/auth/choose-google-account`

## Purpose
- Add a clear intermediate step before Google OAuth.
- Improve clarity on shared devices with multiple signed-in Google accounts.

## Flow
1. User clicks `Continue with Google` from auth form.
2. User lands on `/auth/choose-google-account?returnTo=...`.
3. User taps `Continue with Google`.
4. OAuth starts with `prompt=select_account`.
5. After successful auth, callback goes to `/auth/post-login?returnTo=...`.

## Implementation
- Params config: `apps/web/lib/auth/googleOAuthParams.ts`
- Chooser page: `apps/web/app/auth/choose-google-account/page.tsx`
- Action component: `apps/web/components/auth/GoogleChooserActions.tsx`

