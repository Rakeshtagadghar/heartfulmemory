# Text Slot Mapping Rules v1 (Sprint 21)

## Deterministic Mapping
- `slot.title` -> chapter title
- `slot.subtitle` -> chapter subtitle (or draft summary fallback)
- `slot.body` -> concatenated draft sections (truncated for v1)
- `slot.quote` -> first draft quote
- `slot.caption1/2/...` -> image idea reasons (fallback to place/date summary)

## Fallbacks
- If no quotes exist, derive a pull-quote from the draft summary or first section sentence.
- If body text exceeds the v1 slot budget, truncate and append `...` and emit a warning.
- Missing slots are ignored safely.

## Constraints
- No LLM calls in mapping.
- Same draft + slot list must produce the same output every run.
