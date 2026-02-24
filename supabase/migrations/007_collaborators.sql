-- Sprint 4 / collaborators (owner-only policies initially; collaborator logic expands later)
create type if not exists public.collab_role as enum ('OWNER', 'EDITOR', 'VIEWER');

create table if not exists public.collaborators (
  id uuid primary key default gen_random_uuid(),
  storybook_id uuid not null references public.storybooks(id) on delete cascade,
  invited_email text,
  user_id uuid references auth.users(id) on delete set null,
  role public.collab_role not null default 'VIEWER',
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collaborators_storybook_id_idx on public.collaborators (storybook_id);
create index if not exists collaborators_user_id_idx on public.collaborators (user_id);
create index if not exists collaborators_invited_email_idx on public.collaborators (invited_email);
create index if not exists collaborators_status_idx on public.collaborators (status);
