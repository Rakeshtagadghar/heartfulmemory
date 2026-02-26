# QA Checklist: Sprint 20 Auto-Illustrate

## Preconditions
- Sprint 17 guided chapter is completed.
- Sprint 19 chapter draft is generated and `ready`.
- Stock provider keys configured (`UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`) if using live providers.

## Manual Checklist
- Open `/book/{storybookId}/chapters/{chapterInstanceId}/illustrations`.
- Run `Auto-Illustrate` and verify a `ready` illustration version is created.
- Verify each visible slot shows an image preview and attribution text/provider badge.
- Confirm selected images meet slot threshold expectations (resolution shown).
- Click `Regenerate All` and verify a new version appears.
- Lock one slot, regenerate again, and verify the locked slot assignment remains unchanged.
- Use `Replace` for one slot, search, choose a candidate, and verify assignment updates.
- Verify attribution metadata persists after replace.
- Re-run auto-illustrate without regenerate and verify existing `ready` result is reused.
- Verify friendly error messages for no draft / no candidates / rate-limit paths.

## Regression Checks
- Guided chapter wizard still functions (answer/skip enforcement unchanged).
- Draft review page still loads and links to illustrations.
- Manual Studio open path remains available for completed chapters.
