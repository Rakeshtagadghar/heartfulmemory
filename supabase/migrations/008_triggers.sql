-- Sprint 4 / updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_storybooks on public.storybooks;
create trigger set_updated_at_storybooks before update on public.storybooks
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_chapters on public.chapters;
create trigger set_updated_at_chapters before update on public.chapters
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_chapter_blocks on public.chapter_blocks;
create trigger set_updated_at_chapter_blocks before update on public.chapter_blocks
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_assets on public.assets;
create trigger set_updated_at_assets before update on public.assets
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_collaborators on public.collaborators;
create trigger set_updated_at_collaborators before update on public.collaborators
for each row execute function public.set_updated_at();
