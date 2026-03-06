# Voice Error Taxonomy

Sprint 44 starts with one shared set of voice error codes for both surfaces:

- `MIC_PERMISSION_DENIED`
- `MIC_PERMISSION_DISMISSED`
- `MIC_NOT_FOUND`
- `MIC_IN_USE`
- `MIC_INSECURE_CONTEXT`
- `MIC_UNSUPPORTED_BROWSER`
- `MIC_CAPTURE_FAILED`
- `MIC_SILENT_AUDIO`
- `MIC_RECORDING_FAILED`
- `STT_NETWORK_ERROR`
- `STT_PROVIDER_ERROR`
- `STT_TIMEOUT`
- `UNKNOWN_ERROR`

Current implementation notes:

- The wizard recorder and the studio textbox mic now normalize both legacy and new error codes into this shared set.
- User-facing copy is centralized in `apps/web/lib/voice/errors/voiceErrorCopy.ts`.
- Preflight checks live in `apps/web/lib/voice/preflight.ts`.
- Voice failures are logged to Sentry with stable codes through `apps/web/lib/observability/voiceTelemetry.ts`.
- No transcript text or audio payloads are included in telemetry.
