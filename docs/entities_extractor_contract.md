# Entities Extractor v2 Contract

Convex action: `entitiesExtractor.extractFromAnswers`

Inputs:
- `storybookId`
- `chapterInstanceId`
- `chapterKey`
- `answers[]` with `{ questionId, questionPrompt, answerText }`

Output (current foundation shape):
- Success: `{ ok: true, provider, entities, warnings }`
- Error: `{ ok: false, errorCode, message, retryable }`

Entity rules:
- Grounded only in provided answers
- Each entity includes `citations[]` of `questionId`
- Confidence is `0..1`
- `meta.generator = "llm_extractor_v2"`

Notes:
- Sprint 23 foundation ships a deterministic heuristic implementation behind this contract.
- The prompt builder (`entitiesExtractorPrompt_v2`) is included so the action can swap to the LLM provider without changing callers.
