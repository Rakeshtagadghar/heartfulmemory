# Narrative Validator Rules

The `narrativeValidator.ts` ensures that the LLM output for the 3-paragraph memoir narrative is high quality and free of common generation artifacts.

## Rules
1. **Instruction Leakage:** Rejects output if any paragraph contains phrases like "Here is the", "Certainly", or "As an AI".
2. **Headings & Formatting:** Rejects output if paragraphs begin with "Opening:", "Story:", "Closing:", or "Paragraph 1:". Output must be clear prose.
3. **Repetition Prevention:** Uses `repetition.ts` (`findRepeatedSentencesAcrossSections`) to scan for cross-paragraph sentence duplication. If identical sentences are found in both Opening and Story, it is rejected.
4. **Length Gating:** Configurable min and max characters per paragraph to ensure a balance of text (default minimum 50 chars, max 1500 chars).
5. **Profanity Hook:** Not fully implemented yet, but basic structure is ready if needed.

## Behavior
Validators act as deterministic gates. If `isValid` returns `false`, the narrative is saved with `status='error'` and the user can hit Regenerate. We never persist the leaked prompt text into the user's readable drafts without the `error` state.
