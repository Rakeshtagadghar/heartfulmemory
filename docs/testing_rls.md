# RLS Testing (Sprint 4)

## Goal
Catch accidental public access regressions early.

## Recommended Harness
- Use two authenticated test users and one anon client.
- Run simple CRUD checks against `storybooks`, `chapters`, and `chapter_blocks`.
- Keep tests idempotent and clean up created rows.

## Included in Repo
- `apps/web/tests/integration/rls_storybooks.test.ts` (env-gated placeholder harness)

## Before Running
- Set Supabase env vars in `.env`
- Apply Sprint 3 + Sprint 4 migrations and policies
