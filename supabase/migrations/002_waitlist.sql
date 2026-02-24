-- Sprint 3 / waitlist migration target
create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing',
  utm_source text,
  utm_campaign text,
  utm_medium text,
  referrer text,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_lower_uidx on public.waitlist (lower(email));
create index if not exists waitlist_source_idx on public.waitlist (source);
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
