# Sprint 4 Release Checklist (Memorioso)

Status: Started locally (schema/RLS/data-layer foundation).

## DB Schema / RLS
- [ ] Apply migrations `003`-`008`
- [ ] Apply `supabase/policies/rls_storybook_core.sql`
- [ ] Verify RLS enabled on all core tables
- [ ] Run owner/anon RLS checks

## App Flow
- [ ] Wire `/app/start` to create storybook rows via data layer
- [ ] Add `/app/storybooks/:id` DB-backed stub load
- [ ] Persist chapter ordering / block stubs

## QA
- [ ] No public read access to story content
- [ ] Friendly error states on CRUD failures
- [ ] Basic integration tests pass against configured Supabase project
