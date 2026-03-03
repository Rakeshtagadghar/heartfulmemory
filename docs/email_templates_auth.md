# Sprint 36 Auth Emails (Resend)

## Provider
- Resend free tier (`3000/month`, `100/day`, `1 domain`) for Sprint 36.

## Templates
1. Verify your email
2. Your login code (OTP)
3. Magic link sign-in (optional path)
4. Reset your password
5. Password changed confirmation (optional)

## Required Content
- Product logo/name header.
- Clear single CTA.
- Expiry note (code/link validity).
- Security footer:
  - `If you did not request this, you can ignore this email.`

## Anti-Abuse and Privacy
- No account existence leakage in email request endpoints.
- Never log full codes, tokens, or full reset URLs.
- Keep plain-text fallback for every HTML template.

## Sprint 37 Alignment
- Reuse same template shell for account deletion/pending deletion notifications.
- Keep sender/domain config centralized to avoid duplicate retention-related mail config later.

