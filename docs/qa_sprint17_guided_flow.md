# Sprint 17 QA Checklist: Guided Template + Chapter Wizard Flow

## Scope
- Template and no-template create paths
- Guided chapter list progress/resume
- Chapter wizard v1 (save/next/back/skip/finish)
- Studio routing handoff with chapter context (stub populate hook)
- Narration settings persistence
- Basic analytics instrumentation (manual verification in dev console / `analytics:event`)

## Manual Checklist

### Template Path
- Open `/create/template`
- Verify template cards render for:
  - `tpl_childhood_roots_v2`
  - `tpl_love_family_v2`
- Verify each card shows the expected chapter titles from `docs/templates_v2.json`
- Click `Use Template` for each template and confirm redirect to `/book/{storybookId}/chapters`
- Verify `storybookChapters` are instantiated in the expected order with `not_started` status

### Freeform Path
- Open `/create/freeform`
- Create a freeform storybook
- Confirm redirect to `/book/{storybookId}/chapters`
- Verify one default guided chapter exists (`Chapter 1`)
- Open the wizard and confirm the default freeform question renders

### Chapter List / Progress
- Confirm `chapters_view` analytics event fires once on load
- Verify chapter cards show status badges and progress counts
- Click `Start` on a fresh chapter and confirm wizard opens
- Answer a question and click `Next`
- Return to chapter list and verify status changes to `In Progress`
- Re-open same chapter and confirm resume starts on first unanswered required question

### Wizard v1
- Verify controls exist: `Back`, `Save`, `Skip`, `Next`/`Finish Chapter`
- `Save` persists and stays on the same step
- `Next` persists and advances
- `Back` returns to prior step without losing saved content
- `Skip` persists `skipped=true` and advances
- Reload the wizard mid-chapter and confirm resume logic selects the correct step
- Attempt `Finish Chapter` with missing required questions and confirm validation redirects to missing question
- Complete required questions (or skip explicitly) and finish chapter successfully
- Confirm redirect back to chapter list and completed status is shown
- Confirm `chapter_complete` analytics event is recorded after successful completion redirect

### Studio Route Handoff (Stub)
- On a completed chapter card, click `Open in Studio`
- Confirm route goes through `/studio/{storybookId}?chapter={chapterInstanceId}`
- Confirm studio opens without error
- Confirm guided chapter context banner appears in Layout Studio (stub populate hook)

### Narration Settings (v0)
- On chapter list page, change narration settings fields:
  - voice
  - tense
  - tone
  - length
- Save and reload page
- Confirm values persist
- Confirm defaults apply on a new storybook if untouched (`third_person`, `past`, `warm`, `medium`)

### Regression Smoke (Sprint 16 Areas)
- Open legacy `/app/start` flow and ensure existing path still renders
- Open `/app/storybooks/{id}` and confirm editor shell loads for existing storybooks
- Open `/app/storybooks/{id}/layout` and confirm layout studio still loads

## Notes / Known Sprint 17 Boundaries
- Voice input button is placeholder only (text input is the supported v1 path)
- Studio population from guided answers is a later sprint (context handoff only in Sprint 17)
