# PDF Font Assets

Sprint 16 v1 uses Playwright HTML->PDF and currently falls back to `local()` fonts via `packages/pdf/fonts/embedFonts.ts`.

To harden determinism in a follow-up:

1. Add bundled font files here (e.g. `Inter-Regular.woff2`, `Inter-SemiBold.woff2`, `Inter-Bold.woff2`).
2. Point `packages/pdf/fonts/fontRegistry.ts` entries to the local file paths.
3. Regenerate golden fixtures after font lock-in.

