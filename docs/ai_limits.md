# Sprint 19 AI Limits & Config

## Environment Variables

- `AI_PROVIDER_DEFAULT` (`heuristic` or `groq`)
- `AI_MAX_RETRIES` (default `1`)
- `AI_TIMEOUT_MS` (default `45000`)
- `AI_RATE_LIMIT_PER_USER` (per minute, default `20`)
- `AI_MAX_WORDS_BY_LENGTH` (JSON string)
  - Example: `{"short":350,"medium":700,"long":1100}`

Optional client-visible values used for analytics/UI defaults:

- `NEXT_PUBLIC_AI_PROVIDER_DEFAULT`
- `NEXT_PUBLIC_AI_MAX_RETRIES`

## Safety / Logging Constraints

- Do not log raw prompts or chapter answers in production logs.
- Do not send user content to analytics.
- Return stable error codes (`RATE_LIMIT`, `CHAPTER_NOT_COMPLETED`, etc.) to the UI.

## Rate Limiting

- Sprint 19 uses an in-memory per-user per-minute soft limiter in `convex/ai/rateLimit.ts`.
- Applies to full draft generation and section regeneration.

