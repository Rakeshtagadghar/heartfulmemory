# STT Configuration (Sprint 18)

## Server / Convex env
- `STT_PROVIDER_DEFAULT=groq|elevenlabs`
- `STT_MAX_SECONDS_PER_ANSWER=180`
- `STT_LANGUAGE_DEFAULT=en`
- `STT_RATE_LIMIT_PER_USER=60`
- `STT_ACTION_TIMEOUT_MS=45000`
- `GROQ_API_KEY=...`
- `ELEVENLABS_API_KEY=...`
- `ENABLE_VOICE_INPUT=true|false`
- `ENABLE_AUDIO_STORAGE=false|true`

## Client flags (optional mirror for UI)
- `NEXT_PUBLIC_ENABLE_VOICE_INPUT=true|false`
- `NEXT_PUBLIC_ENABLE_AUDIO_STORAGE=false|true`

## Defaults (Sprint 18)
- Provider: `groq`
- Max duration: `180s`
- Language: `en`
- Voice input enabled: `true`
- Audio storage enabled: `false` (privacy-first)

## Notes
- API keys must only be read in server-side code / Convex actions.
- Client should rely on feature flags and server errors for final enforcement.
