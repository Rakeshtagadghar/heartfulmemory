# Sentry Dashboard (Sprint 24)

Create one dashboard named `Storykeeper - Production Health`.

## Widget Set

1. `Top Issues (24h)`
   - Query: `environment:production`
   - Group by issue

2. `Error Rate by Flow`
   - Query: `environment:production level:error`
   - Breakdown tag: `flow`

3. `Slow Transactions`
   - Query: `environment:production transaction:*`
   - Sort by p95

4. `Export Health`
   - Query: `flow:export_pdf_post`
   - Breakdown tag: `errorCode`

5. `Draft Generation Health`
   - Query: `flow:draft_generate_v2 OR flow:draft_regen_section_v2`
   - Breakdown tag: `errorCode`

6. `Studio Interaction Trail`
   - Query: `feature:studio`
   - View breadcrumbs and recent events by `storybookId`

## Useful Saved Searches

- `flow:studio_open_populate errorCode:POPULATE_FAILED`
- `flow:stt_transcribe level:error`
- `flow:auto_illustrate errorCode:NO_CANDIDATES`
- `flow:export_pdf_post errorCode:EXPORT_RENDER_FAILED`
