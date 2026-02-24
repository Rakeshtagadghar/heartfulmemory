-- Sprint 3 baseline RLS for profiles + waitlist
alter table public.profiles enable row level security;
alter table public.waitlist enable row level security;

-- Profiles: owner-only
 drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

 drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

 drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Waitlist: anon insert only, no public reads
 drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);
