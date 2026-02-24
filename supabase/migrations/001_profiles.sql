-- Sprint 3 / profiles
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  onboarding_completed boolean not null default false,
  onboarding_goal text,
  marketing_consent boolean,
  locale text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_onboarding_completed_idx on public.profiles (onboarding_completed);
