-- Sprint 4 / chapter blocks
create type if not exists public.block_type as enum ('TEXT', 'IMAGE', 'VIDEO', 'GIF', 'EMBED');

create table if not exists public.chapter_blocks (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  storybook_id uuid not null references public.storybooks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type public.block_type not null,
  order_index int not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chapter_blocks_chapter_id_idx on public.chapter_blocks (chapter_id);
create index if not exists chapter_blocks_storybook_id_idx on public.chapter_blocks (storybook_id);
create index if not exists chapter_blocks_owner_id_idx on public.chapter_blocks (owner_id);
create index if not exists chapter_blocks_type_idx on public.chapter_blocks (type);
create index if not exists chapter_blocks_chapter_order_idx on public.chapter_blocks (chapter_id, order_index);
