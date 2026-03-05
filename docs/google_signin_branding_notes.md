# Google Sign-In Branding Notes (Sprint 38)

## Implemented
- Primary label: `Continue with Google`
- Google mark: inline multi-color `G` icon (not modified shape)
- Button style:
  - white background
  - subtle gray border
  - dark text
  - consistent height with auth CTAs (`h-12`)

## Where
- Component: `apps/web/components/auth/ContinueWithGoogleButton.tsx`
- Used in:
  - `apps/web/components/auth/magic-link-form.tsx`
  - `apps/web/components/auth/GoogleChooserActions.tsx`

## Notes
- We keep Google button visuals isolated in one reusable component to avoid drift.
- OAuth prompt behavior is configured separately through `googleAuthorizationParams`.

