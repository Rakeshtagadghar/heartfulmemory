# STT Provider Contract (Sprint 18)

## Purpose
Provide a small, swappable speech-to-text interface so the app can switch between `groq` and `elevenlabs` without changing Wizard UI code.

## Interface

### Input (`sttProvider.transcribe`)
- `audioBase64: string`
- `mimeType: string`
- `language?: string | null`
- `prompt?: string | null`
- `provider: 'groq' | 'elevenlabs'`

### Output
- `transcriptText: string`
- `confidence?: number | null`
- `durationMs?: number | null`
- `providerRequestId?: string | null`
- `raw?: Record<string, unknown> | null` (minimal metadata only; no transcript text needed here)

## Error Model
Actions return structured errors with stable codes:
- `MIC`
- `NETWORK`
- `PROVIDER_RATE_LIMIT`
- `PROVIDER_TIMEOUT`
- `PROVIDER_ERROR`
- `UNSUPPORTED_MIME`
- `INVALID_AUDIO`
- `NOT_CONFIGURED`
- `UNKNOWN`

## Implementation Notes (Sprint 18)
- Convex action entrypoint: `convex/stt.ts -> transcribe`
- Provider abstraction: `lib/stt/providerRegistry.ts`
- Error mapping: `lib/stt/errorMap.ts`
- API keys remain server-side only (Convex env)
