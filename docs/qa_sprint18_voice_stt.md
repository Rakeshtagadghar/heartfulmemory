# Sprint 18 QA Checklist: Voice Capture + STT + Transcript Review

## Manual Checklist

### Happy Path (Voice)
- Open a wizard question in `/book/{storybookId}/chapters/{chapterInstanceId}/wizard`
- Confirm `Voice | Type` toggle is visible (Voice default when enabled)
- Read and accept voice consent notice
- Start recording, confirm timer + recording state
- Stop recording, confirm transcribing state
- Confirm transcript appears in answer text area
- Edit transcript text
- Save / Next and confirm answer persists
- Reload wizard and confirm saved transcript text resumes

### Error & Fallback Paths
- Deny microphone permission and confirm clear guidance + `Switch to Typing`
- Simulate network failure during transcription and confirm retry + typing fallback options
- Retry transcription without page reload
- Record again and confirm a fresh transcript can be produced

### Limits & Privacy
- Record until max duration and confirm auto-stop
- Confirm UI messaging states transcript-only storage (privacy-first)
- Confirm no raw transcript is sent to analytics payloads (dev console `analytics:event`)

### Completion Regression
- Complete a chapter with voice-derived answers and/or skips
- Confirm chapter completion still requires answer or skip for all questions
- Open Studio from a completed chapter and confirm context handoff remains functional

## Automated Coverage Added (Sprint 18 foundation + voice UI)
- Recorder state machine transitions (unit)
- STT error mapping stable codes (unit)
- `chapterAnswers` voice metadata persistence path (`sttMeta`, `upsertVoice`) source-contract integration check
