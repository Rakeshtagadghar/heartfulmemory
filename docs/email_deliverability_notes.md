# Email Deliverability Notes (v1)

## Sender identity
- Use verified sender domain in Resend.
- Keep from-address consistent (example: `Memorioso <noreply@memorioso.com>`).

## Content hygiene
- Include plain-text fallback for every template.
- Keep subject lines concise and intent-specific.
- Avoid unnecessary links and large image payloads.
- Do not include sensitive billing or account data in body.

## Technical hygiene
- Use absolute HTTPS URLs for links and logo.
- Prefer PNG logo assets for broad client support.
- Keep HTML lightweight and table-safe.
- Use anti-enumeration copy in auth request flows.
- Log template/system errors without PII.

## DNS posture (outside code)
- SPF aligned for sender provider.
- DKIM enabled.
- DMARC policy configured with monitoring.
