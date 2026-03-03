# Email Sender Architecture

## Goal
Keep template rendering and sending provider separate so Resend can be swapped later.

## Layers
1. `@memorioso/emails`
- Owns template contracts, validation, and HTML/text rendering.
- Exposes `renderEmail(templateId, vars)` and typed template functions.

2. `apps/web/lib/email/renderEmail.ts`
- App-level thin adapter around `@memorioso/emails`.

3. `apps/web/lib/email/validateTemplateVars.ts`
- Runtime validation helper that returns stable result shape.
- Provides missing variable names for observability without leaking PII.

4. `apps/web/lib/email/sender.ts`
- Provider interface and initial Resend implementation.
- Stable error codes:
  - `EMAIL_PROVIDER_NOT_CONFIGURED`
  - `EMAIL_PROVIDER_REJECTED`
  - `EMAIL_PROVIDER_ERROR`

5. `apps/web/lib/email/resendClient.ts`
- Backward-compatible adapter to existing call sites.

## Data flow
`build*Template()` -> `validateTemplateVars()` -> `renderEmail()` -> `sendEmail()`

## Failure behavior
- Variable/render failures: logged with template id and missing var names.
- Provider failures: return safe error to caller, no hard crash.
- Auth flows keep user-safe messaging and anti-enumeration text.