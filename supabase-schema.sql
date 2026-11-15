-- KINORA initial database schema
create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  content text not null default '',
  sources text not null default '',
  category text not null default 'General',
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles enable row level security;

-- Public can read published articles only.
create policy "Anyone can read published articles"
on public.articles for select
using (status = 'published');

-- Signed-in users can submit drafts attributed to themselves.
create policy "Signed-in users can submit drafts"
on public.articles for insert to authenticated
with check (status = 'draft' and created_by = auth.uid());

-- NOTE: Moderator/admin policies and revision history are the next database stage.
-- Do not enable public UPDATE or DELETE policies.
