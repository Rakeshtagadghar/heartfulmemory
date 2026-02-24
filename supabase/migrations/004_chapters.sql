-- Sprint 4 / chapters
create type if not exists public.chapter_status as enum ('DRAFT', 'FINAL');

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  storybook_id uuid not null references public.storybooks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Chapter',
  status public.chapter_status not null default 'DRAFT',
  order_index int not null default 0,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chapters_storybook_id_idx on public.chapters (storybook_id);
create index if not exists chapters_owner_id_idx on public.chapters (owner_id);
create index if not exists chapters_storybook_order_idx on public.chapters (storybook_id, order_index);
