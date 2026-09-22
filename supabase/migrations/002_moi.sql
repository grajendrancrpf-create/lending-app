-- LendTrack MOI (family occasion gifts) schema
-- Run via: sb.py sql <project_ref> supabase/migrations/002_moi.sql

create table if not exists public.moi_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  family_name text not null,
  occasion_type text not null default 'marriage'
    check (occasion_type in (
      'marriage', 'engagement', 'housewarming', 'ear_piercing',
      'baby_shower', 'puberty_ceremony', 'funeral', 'birthday', 'other'
    )),
  occasion_of text,
  amount numeric not null check (amount > 0),
  entry_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists moi_entries_user_id_idx on public.moi_entries (user_id);
create index if not exists moi_entries_date_idx on public.moi_entries (user_id, entry_date desc);

alter table public.moi_entries enable row level security;

drop policy if exists "moi_all_own" on public.moi_entries;
create policy "moi_all_own"
  on public.moi_entries for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
