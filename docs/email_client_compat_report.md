# Email Client Compatibility Report (Sprint 37)

## Scope
Templates reviewed:
- Auth: Verify Email, Login Link/Code, Reset Password
- Billing: Subscription Active, Payment Failed

## Compatibility strategy
- Layout uses simple table-based primitives from `@react-email/components`.
- Width constrained to 600px.
- CTA buttons rendered via React Email `<Button>`.
- Avoided CSS features known to break in Outlook (fixed positioning, complex transforms, custom webfonts-only assumptions).
- Compatibility safety checks are automated via `pnpm email:compat`.

## Automated check command
- `pnpm email:compat`
- Current checks:
  - Disallow `position:fixed`, CSS gradients, animations, and `@font-face`.
  - Require a 600px max-width container.
  - Disallow non-HTTPS links/sources (except localhost in dev).

## CSS posture
- Safe defaults: inline styles, block layout, conservative spacing.
- Limited color accents and borders only.
- No background images or heavy effects required for legibility.

## Manual verification checklist
- Gmail web/mobile: structure, button, fallback link.
- Outlook desktop/web: heading and button alignment.
- Apple Mail macOS/iOS: spacing, typography, logo rendering.

## Known constraints
- Remote images can be blocked by client defaults. Templates always include product name text fallback.
- SVG logo support varies across legacy clients, so templates now default to a PNG logo asset.
