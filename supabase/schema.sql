-- Maqra: schema pour la connexion + le suivi de progression
-- A coller dans Supabase -> SQL Editor -> Run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 140,
  notifications_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  dark_mode boolean not null default false,
  learning_focus text not null default 'lecture',
  updated_at timestamptz not null default now()
);

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id integer not null,
  progress integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

alter table public.profiles enable row level security;
alter table public.module_progress enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "module_progress: select own" on public.module_progress
  for select using (auth.uid() = user_id);
create policy "module_progress: insert own" on public.module_progress
  for insert with check (auth.uid() = user_id);
create policy "module_progress: update own" on public.module_progress
  for update using (auth.uid() = user_id);

-- Cree automatiquement un profil par defaut a l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
