# Dev Workflow (Sprint 3)

## Quick Start
1. `pnpm install`
2. Configure `.env` from `.env.example`
3. Apply Supabase SQL in `supabase/migrations/*` and `supabase/policies/rls_baseline.sql`
4. `pnpm --filter web dev`
5. Open `/login`

## Fast Manual Smoke Test
1. Visit `/app` and confirm redirect to `/login?returnTo=%2Fapp`
2. Submit magic link request on `/login`
3. Complete auth callback
4. Confirm `/app/onboarding` appears for first-time user
5. Submit onboarding and verify redirect to `/app/start`
6. Confirm `/api/waitlist` still accepts landing form submissions

## Notes
- Without Supabase env vars, `/login` shows a configuration warning and auth requests return 503.
- `/api/waitlist` falls back to local `.data/waitlist.jsonl` when service role is absent.
