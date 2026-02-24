# Supabase Setup (Sprint 3)

## Required Env Vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_SITE_URL`

## Local Setup
1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill values.
3. Run SQL files in order:
   - `supabase/migrations/001_profiles.sql`
   - `supabase/migrations/002_waitlist.sql`
   - `supabase/policies/rls_baseline.sql`
4. Enable Email auth (magic link) in Supabase Auth settings.
5. Set redirect URL: `http://localhost:3000/auth/callback` and your production domain callback.

## Vercel Setup
- Add the same env vars to Preview + Production.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is server-only and never exposed as `NEXT_PUBLIC_*`.

## Notes
- The app gracefully shows a config warning on `/login` if Supabase env vars are missing.
- `/api/waitlist` falls back to file storage when Supabase service role is not configured.
