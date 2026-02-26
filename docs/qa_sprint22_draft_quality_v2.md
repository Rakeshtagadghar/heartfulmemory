# Sprint 22 QA: Draft Quality v2 (Prompt-Safe Storytelling)

## Goal
- Ensure no prompt or internal guidance text leaks into Draft Review UI.
- Ensure sections are differentiated and minimally repetitive.
- Ensure validator blocks clearly bad outputs and surfaces user-safe warnings.

## Manual Checklist
1. Generate a chapter draft from completed answers.
2. Confirm section text reads as narrative prose (not instructions or prompt text).
3. Confirm no section contains phrases like `Write as...`, `Return only...`, `Constraints:`.
4. Confirm Draft Review shows section content and citations only (questionIds), no internal guidance.
5. Regenerate one section and verify only that section text changes in the new version.
6. Confirm warnings (if any) are human-readable and do not expose regex or raw prompt internals.
7. Confirm entity warnings, if shown, are meaningful (e.g. not `The`, `My`, `Our`).
8. Confirm `India` / `Maharashtra` are accepted when present in answers (no false positive warning).
9. Confirm repeated section text (if forced via mock/provider debug) is rejected or flagged by validator.

## Automated Coverage (Sprint 22)
- Prompt leakage validator unit tests
- Repetition detector unit tests
- Draft render safety UI test (guidance never rendered)
- Entity sanity stopword tests
- Source contract test for v2 action wiring and guidance persistence

