# Observability Policy (Sprint 24)

This policy defines what telemetry is allowed in Sentry and what must be redacted.

## Goals

- Capture actionable failures for Studio, AI, STT, and export flows.
- Keep events traceable to flow + chapter + release.
- Prevent raw user content and sensitive values from being sent.

## Never Send

- Full chapter transcript text.
- Full story narrative text.
- Raw prompts and raw provider request/response payloads.
- Image URLs with private keys/signatures.
- Access tokens, auth headers, passwords, API keys.
- Payment details and email body content.

## Allowed Metadata

- `storybookId`, `chapterKey`, `chapterInstanceId`.
- `flow`, `feature`, `provider`, `mode`, `errorCode`.
- Route/pathname (query params redacted except whitelist).
- Performance timings (`durationMs`, attempt counts, step names).
- Stable error codes and retryability flags.

## Tags and Contexts

- Tags: `env`, `release`, `feature`, `flow`, `provider`, `mode`.
- Contexts: `storybook`, `chapter`, `billingEntitlement`.
- Breadcrumbs: key milestones only (`ui_action`, `api_call`, `editor_action`, `export_step`).

## Redaction Rules

- Remove request bodies by default.
- Redact sensitive key names recursively (`token`, `secret`, `password`, `transcript`, `story`, `prompt`, etc).
- Clamp long strings before capture.
- Sanitize query params and keep only approved keys (`chapter`, `page`, `mode`).

## Implementation Notes

- Shared helpers in `lib/observability/*` enforce this policy for both client/server usage.
- Convex instrumentation must use stable error codes and metadata only.
- Local development should remain safe when DSN is missing (no runtime failures).
