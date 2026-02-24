-- Sprint 4 / assets
create type if not exists public.asset_source as enum (
  'UPLOAD',
  'UNSPLASH',
  'PEXELS',
  'PIXABAY',
  'OPENVERSE',
  'RAWPIXEL_PD',
  'VECTEEZY'
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source public.asset_source not null,
  source_asset_id text,
  source_url text,
  storage_provider text,
  storage_bucket text,
  storage_key text,
  mime_type text,
  width int,
  height int,
  duration_seconds int,
  size_bytes bigint,
  checksum text,
  license jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_owner_id_idx on public.assets (owner_id);
create index if not exists assets_source_idx on public.assets (source);
create index if not exists assets_storage_key_idx on public.assets (storage_key);
