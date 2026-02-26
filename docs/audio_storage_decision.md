# Audio Storage Decision (Sprint 18)

## Decision
Choose **Option A: Do not store audio** (privacy-first) for Sprint 18.

## What is stored
- Transcript text (saved in `chapterAnswers.answerText`)
- STT metadata (`chapterAnswers.sttMeta`) such as provider, duration, confidence (if available)
- `source='voice'`

## What is NOT stored (Sprint 18)
- Raw audio bytes
- Audio blob/file references (`audioRef` remains optional for future use and defaults to `null`)

## Why
- Reduces privacy risk and storage complexity
- Meets Sprint 18 goal (capture + review transcript)
- Keeps re-transcribe/replay features available for a later sprint if needed

## User-facing UX implication
- Voice will be recorded locally, sent for transcription, and transcript text will be saved
- Audio recording is discarded after transcription/review (unless future feature flag enables storage)
