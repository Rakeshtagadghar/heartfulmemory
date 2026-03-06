# Featurebase Loader Notes

## Current scope

- The SDK is injected only from the authenticated `AppShell`.
- This keeps landing and SEO routes free of Featurebase script weight and widget markup.
- The initial scaffold preloads the feedback widget and messenger in a hidden or safe state so later sprint tasks can attach explicit launchers.

## Environment variables

- `NEXT_PUBLIC_FEATUREBASE_ENABLED`
- `NEXT_PUBLIC_FEATUREBASE_ORGANIZATION`
- `NEXT_PUBLIC_FEATUREBASE_APP_ID`
- `NEXT_PUBLIC_FEATUREBASE_FEEDBACK_DEFAULT_BOARD`
- `NEXT_PUBLIC_FEATUREBASE_LOCALE`

## Free-tier assumptions baked into the loader

- No white-label assumptions.
- No custom-domain assumptions.
- Messenger boots with `hideDefaultLauncher: true` so the later Studio-safe launcher work can control when and where it becomes visible.
- Feedback widget initializes without forcing a default floating placement.

## CSP note

Allow the Featurebase SDK origin if a strict Content Security Policy is added later:

- `https://do.featurebase.app`
