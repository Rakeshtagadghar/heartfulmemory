# RLS Verification Steps (Sprint 4)

## Apply SQL
1. `supabase/migrations/003_storybooks.sql`
2. `supabase/migrations/004_chapters.sql`
3. `supabase/migrations/005_blocks.sql`
4. `supabase/migrations/006_assets.sql`
5. `supabase/migrations/007_collaborators.sql`
6. `supabase/migrations/008_triggers.sql`
7. `supabase/policies/rls_storybook_core.sql`

## Manual Checks
- Confirm RLS enabled on: `storybooks`, `chapters`, `chapter_blocks`, `assets`, `collaborators`
- Using anon client, verify select fails for all user-content tables
- Using authenticated User A, create storybook/chapter/block and read succeeds
- Using authenticated User B, read User A rows fails
- Update a row and confirm `updated_at` changes automatically

## Current Scope
- Owner-only policies are the baseline.
- Collaborator read/write expansion can be layered later without changing the core schema.
