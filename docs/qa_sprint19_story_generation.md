# Sprint 19 QA Checklist: Story Generation v1

## Manual Checklist

1. Complete a guided chapter in the wizard (typed or voice transcript).
2. Open `/book/{storybookId}/chapters/{chapterInstanceId}/draft`.
3. Generate a draft.
4. Verify narration settings influence output (first person shows `I`, third person shows `They`).
5. Verify sections show citations referencing chapter `questionId`s.
6. Regenerate one section and verify other sections remain unchanged.
7. Verify warnings panel appears when output is short or entity sanity flags.
8. Save narration settings and confirm prompt to regenerate appears.
9. Refresh the page and confirm latest draft/version persists.
10. Approve draft and verify approved state indicator in version history.

## Expected Error Handling

- Generating before chapter completion should show an error.
- Rate limits should return a graceful message.
- Invalid section regeneration should show an error.

