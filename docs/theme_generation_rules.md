# Theme Generation Rules (Sprint 20)

## Goal
- Generate provider-friendly, privacy-safe image search themes from a completed chapter draft.

## Inputs
- Chapter title / chapter key
- Draft summary
- Draft key facts
- Draft entities (places only by default)
- Draft image ideas
- Storybook narration tone

## Privacy Rules
- Do not include personal names in generated queries by default.
- Place names may be used only if they do not look like private person names.
- Prefer generic family/memory/location phrases over specific people.

## Query Rules
- Output `3-8` short queries.
- Queries should be stock-provider friendly (short phrases, no punctuation-heavy text).
- Include tone hints (for example: `warm nostalgic`, `documentary portrait`, `joyful candid`).
- Keep a small `negativeKeywords` list to avoid low-quality stock results (`watermark`, `logo`, `blurry`, etc.).

## Determinism
- Same inputs should produce the same query/keyword output.
- Heuristic generation is used in Sprint 20 v1 (no LLM dependency required).
