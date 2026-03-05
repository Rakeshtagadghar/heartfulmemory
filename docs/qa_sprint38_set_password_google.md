# QA Checklist - Sprint 38 (Set Password + Google UX)

## Manual
- Sign in with Google from `/auth/sign-in`:
  - confirm redirect to `/auth/choose-google-account`
  - confirm Google account picker is shown
- Complete login with user having no password:
  - confirm redirect to `/account/set-password`
  - set password and verify redirect back to `returnTo`
- From `/account/set-password`, click `Skip for now`:
  - confirm redirect to `returnTo`
  - confirm immediate next login does not force set-password during skip window
- After successful set password:
  - confirm confirmation email is attempted
  - verify UI still succeeds if email send fails

## Automated
- `tests/auth/postLoginRedirect.test.ts`
- `tests/ui/continueWithGoogleButton.test.tsx`
- `tests/auth/googleChooserRedirect.test.ts`
- `tests/auth/setPasswordRoute.test.ts`
- `tests/emails/render-email.test.ts` (password_set_success snapshot)

