# Email Branding Guidelines (Sprint 37)

## Brand tokens
- Source: `packages/emails/src/theme/tokens.ts`
- Core palette:
  - Background: `#061024`
  - Card: `#0b1629`
  - Panel: `#0f1d36`
  - Body text: `#e6ebf6`
  - Accent button: `#d5b36a`
  - Brand mark: `#d8bb80`

## Layout rules
- Max width: `600px`.
- Dark card container with border and rounded corners.
- Inner panel sections for primary content blocks.
- Large heading (`30px`) and minimum body size (`16px`).
- CTA button uses high contrast (`accent` + dark text).
- Logo lockup uses PNG in emails for reliable client rendering.

## Accessibility
- Include logo alt text when `logoUrl` is used.
- Keep body text at 14px+ (current default 16px).
- Always include plain-text fallback copy.
- Include a support link and security note in every auth email.

## Deliverability hygiene
- Keep markup lightweight and avoid advanced CSS.
- Use absolute HTTPS URLs for links and images.
- Avoid external runtime dependencies inside email HTML.
- Keep subjects and preheaders short and task-oriented.
