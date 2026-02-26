# Sprint 19 Chapter Draft Generation Contract

## Provider Interface

`llm.generateChapterDraft(input)`

### Input

- `templateId: string | null`
- `chapterKey: string`
- `chapterTitle: string`
- `questionAnswers[]`
  - `questionId: string`
  - `prompt: string`
  - `answerText: string`
- `narrationSettings`
  - `voice: first_person | third_person`
  - `tense: past | present`
  - `tone: warm | formal | playful | poetic`
  - `length: short | medium | long`
- `targetSections[]`
  - `sectionId`
  - `title`
  - `guidance`

### Output

- `summary: string`
- `sections[]`
  - `sectionId`
  - `title`
  - `text`
  - `wordCount`
  - `citations[]` (questionIds)
  - optional `uncertain`
- `keyFacts[]` (with citations)
- `quotes[]` (with citations)
- `entities`
  - `people[]`
  - `places[]`
  - `dates[]`
- `imageIdeas[]`
  - `query`
  - `reason`
  - optional `slotHint`
- `citationsMap: Record<sectionId, questionId[]>`

## Grounding Rules

- Use only provided `questionAnswers`.
- No external web knowledge.
- If a claim is uncertain, mark it `uncertain` and avoid citations.
- Citations must reference existing `questionId`s from the chapter.

## Convex Actions

- `ai/chapterDrafts.generate`
  - Creates a new draft version (`status=generating`)
  - Generates a full structured draft
  - Runs quality checks
  - Persists `ready` or `error`
- `ai/chapterDrafts.regenSection`
  - Creates a new draft version seeded from latest
  - Regenerates one target section
  - Preserves unchanged sections
  - Runs quality checks and persists

