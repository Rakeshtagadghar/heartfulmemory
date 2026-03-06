# Featurebase Messenger Install

## Current implementation

- Messenger boots in the authenticated app shell only.
- A dock-style floating launcher is rendered in the app shell.
- Studio uses a higher bottom offset to avoid overlapping core canvas controls.
- The launcher toggles between an open chat icon and a close chevron state.

## SDK flow

- Messenger boot: `Featurebase("boot", { appId, hideDefaultLauncher: true })`
- Open default messenger: `Featurebase("show")`
- Close messenger: `Featurebase("hide")`
- Open compose view: `Featurebase("showNewMessage")`

## Required env

- `NEXT_PUBLIC_FEATUREBASE_ENABLED=true`
- `NEXT_PUBLIC_FEATUREBASE_APP_ID=<app-id>`
