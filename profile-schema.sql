-- KINORA profile and contribution tracking migration
-- Run this in Supabase SQL Editor AFTER the original KINORA schema.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

alter table public.profiles enable row level security;
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.kinora_create_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
declare chosen_username text;
begin
  chosen_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    'user_' || left(replace(new.id::text, '-', ''), 10)
  );
  insert into public.profiles(id, username)
  values(new.id, chosen_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists kinora_on_auth_user_created on auth.users;
create trigger kinora_on_auth_user_created
after insert on auth.users
for each row execute procedure public.kinora_create_profile();

-- Backfill profiles for accounts that existed before this migration.
insert into public.profiles(id, username)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data->>'username'), ''),
                'user_' || left(replace(u.id::text, '-', ''), 10))
from auth.users u
on conflict (id) do nothing;

create table if not exists public.article_revisions (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  editor_id uuid references auth.users(id) on delete set null,
  chars_added integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists article_revisions_editor_idx on public.article_revisions(editor_id);
create index if not exists article_revisions_article_idx on public.article_revisions(article_id);
alter table public.article_revisions enable row level security;
drop policy if exists "Users can read their own revision records" on public.article_revisions;
create policy "Users can read their own revision records"
  on public.article_revisions for select to authenticated
  using (editor_id = auth.uid());

create or replace function public.kinora_track_article_revision()
returns trigger language plpgsql security definer set search_path = public
as $$
declare editor uuid;
declare added integer;
begin
  if TG_OP = 'INSERT' then
    editor := new.created_by;
    added := char_length(coalesce(new.content, ''));
    insert into public.article_revisions(article_id, editor_id, chars_added)
    values(new.id, editor, added);
    return new;
  end if;

  if new.content is distinct from old.content then
    editor := auth.uid();
    added := greatest(
      char_length(coalesce(new.content, '')) - char_length(coalesce(old.content, '')),
      0
    );
    insert into public.article_revisions(article_id, editor_id, chars_added)
    values(new.id, editor, added);
  end if;
  return new;
end;
$$;

drop trigger if exists kinora_article_revision_tracker on public.articles;
create trigger kinora_article_revision_tracker
after insert or update of content on public.articles
for each row execute procedure public.kinora_track_article_revision();

-- Allow signed-in contributors to see their own drafts and submissions on their profile.
drop policy if exists "Users can read their own articles" on public.articles;
create policy "Users can read their own articles"
  on public.articles for select to authenticated
  using (created_by = auth.uid());

-- Note: this migration deliberately does NOT grant article update permission.
-- Keep your draft/review approval workflow protected. Add a moderated edit workflow separately.
