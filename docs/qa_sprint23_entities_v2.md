# QA - Sprint 23 Entities v2

## Manual Checklist

1. Generate a draft for a chapter with answers mentioning `Maharashtra` and `India`.
2. Verify `Entities` panel shows:
   - `Places`: Maharashtra, India
   - `People`: only real names or roles (no `The`, `Our`, `My`)
   - `Dates`: empty unless explicit dates/years were answered
3. Click an entity citation chip and confirm it opens `/book/.../wizard?questionId=...` on the correct question.
4. Force extractor failure (temporary config/mock) and verify Draft Review still loads with an entities empty-state + `Try Again`.
5. Add an entity override (e.g. place) and regenerate draft; confirm it persists.
6. Remove a wrong entity and regenerate draft; confirm it stays removed.
7. Run auto-illustrate and verify generated queries do not include personal names by default.

## Regression Focus

- Prompt leakage tokens no longer appear as people
- Entity sanity warnings are based on citations + cited answer text only
- No story text token scanning for entity sanity
