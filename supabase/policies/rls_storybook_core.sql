-- Sprint 4 / core storybook RLS (owner-only baseline, collaborator rules can be expanded later)
alter table public.storybooks enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_blocks enable row level security;
alter table public.assets enable row level security;
alter table public.collaborators enable row level security;

-- Storybooks
 drop policy if exists "storybooks_select_own" on public.storybooks;
create policy "storybooks_select_own" on public.storybooks
  for select using (owner_id = auth.uid());

 drop policy if exists "storybooks_insert_own" on public.storybooks;
create policy "storybooks_insert_own" on public.storybooks
  for insert with check (owner_id = auth.uid());

 drop policy if exists "storybooks_update_own" on public.storybooks;
create policy "storybooks_update_own" on public.storybooks
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

 drop policy if exists "storybooks_delete_own" on public.storybooks;
create policy "storybooks_delete_own" on public.storybooks
  for delete using (owner_id = auth.uid());

-- Chapters
 drop policy if exists "chapters_select_own" on public.chapters;
create policy "chapters_select_own" on public.chapters
  for select using (owner_id = auth.uid());

 drop policy if exists "chapters_insert_own" on public.chapters;
create policy "chapters_insert_own" on public.chapters
  for insert with check (owner_id = auth.uid());

 drop policy if exists "chapters_update_own" on public.chapters;
create policy "chapters_update_own" on public.chapters
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

 drop policy if exists "chapters_delete_own" on public.chapters;
create policy "chapters_delete_own" on public.chapters
  for delete using (owner_id = auth.uid());

-- Chapter blocks
 drop policy if exists "blocks_select_own" on public.chapter_blocks;
create policy "blocks_select_own" on public.chapter_blocks
  for select using (owner_id = auth.uid());

 drop policy if exists "blocks_insert_own" on public.chapter_blocks;
create policy "blocks_insert_own" on public.chapter_blocks
  for insert with check (owner_id = auth.uid());

 drop policy if exists "blocks_update_own" on public.chapter_blocks;
create policy "blocks_update_own" on public.chapter_blocks
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

 drop policy if exists "blocks_delete_own" on public.chapter_blocks;
create policy "blocks_delete_own" on public.chapter_blocks
  for delete using (owner_id = auth.uid());

-- Assets
 drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own" on public.assets
  for select using (owner_id = auth.uid());

 drop policy if exists "assets_insert_own" on public.assets;
create policy "assets_insert_own" on public.assets
  for insert with check (owner_id = auth.uid());

 drop policy if exists "assets_update_own" on public.assets;
create policy "assets_update_own" on public.assets
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

 drop policy if exists "assets_delete_own" on public.assets;
create policy "assets_delete_own" on public.assets
  for delete using (owner_id = auth.uid());

-- Collaborators (owner-only baseline)
 drop policy if exists "collaborators_owner_only" on public.collaborators;
create policy "collaborators_owner_only" on public.collaborators
  for all using (
    exists (
      select 1 from public.storybooks s
      where s.id = collaborators.storybook_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.storybooks s
      where s.id = collaborators.storybook_id and s.owner_id = auth.uid()
    )
  );
