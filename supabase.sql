-- Run in Supabase: SQL Editor
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text, city text, bio text,
  is_nanny boolean default false, rate numeric, availability text, rating numeric
);
create table places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users default auth.uid(),
  name text not null, cat text not null, lat float8 not null, lng float8 not null,
  wheelchair boolean default false, changing boolean default false,
  created_at timestamptz default now()
);
create table favorites (
  user_id uuid references auth.users default auth.uid(),
  place_id text, place jsonb not null,
  primary key (user_id, place_id)
);
alter table profiles enable row level security;
alter table places enable row level security;
alter table favorites enable row level security;
create policy "profiles read" on profiles for select using (true);
create policy "profiles insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles update" on profiles for update using (auth.uid() = id);
create policy "places read" on places for select using (true);
create policy "places insert" on places for insert with check (auth.uid() = user_id);
create policy "places delete" on places for delete using (auth.uid() = user_id);
create policy "favs own" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
