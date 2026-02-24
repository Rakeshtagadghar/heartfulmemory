-- Sprint 4 / storybooks core table
create type if not exists public.book_mode as enum ('DIGITAL', 'PRINT');
create type if not exists public.book_status as enum ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED');

create table if not exists public.storybooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Storybook',
  subtitle text,
  book_mode public.book_mode not null default 'DIGITAL',
  status public.book_status not null default 'DRAFT',
  cover_asset_id uuid,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists storybooks_owner_id_idx on public.storybooks (owner_id);
create index if not exists storybooks_status_idx on public.storybooks (status);
create index if not exists storybooks_updated_at_idx on public.storybooks (updated_at desc);
