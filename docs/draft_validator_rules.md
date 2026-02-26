# Draft Validator Rules (Sprint 22 v1)

## Purpose
- Deterministically reject or warn on common bad draft outputs before saving.
- Prevent prompt leakage and high-repetition drafts from reaching the Draft Review UI.

## Error Rules (block save)
- Prompt leakage phrases in `sections[].text` (e.g. "Write as...", "Return only...", "Constraints:")
- Repeated sentence(s) across multiple sections

## Warning Rules (allow save, surface in UI)
- Literal section label prefix (`Opening:`, `The Story:`, `Timeline:`)
- Section too short (configurable minimum words)
- Entity stopwords or obviously invalid entity values (`The`, `My`, `Our`, `I`, `We`)

## Safety
- Validator messages must be human-readable and avoid exposing raw prompt text or regex internals.
- Draft Review UI should render only `sections[].text`; never `guidance`.

