-- LendTrack initial schema
-- Run this in your Supabase project's SQL editor (Dashboard → SQL → New query).

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------- auto-create on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------- loans
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_name text not null,
  phone text,
  pan text,
  loan_type text not null default 'personal'
    check (loan_type in ('personal', 'business', 'gold', 'vehicle', 'microfinance', 'other')),
  principal numeric not null check (principal > 0),
  interest_rate numeric not null default 0 check (interest_rate >= 0),
  rate_type text not null default 'monthly'
    check (rate_type in ('monthly', 'annual', 'flat')),
  disbursement_date date not null,
  tenure_months integer not null default 12 check (tenure_months >= 1),
  emi_amount numeric check (emi_amount is null or emi_amount >= 0),
  status text not null default 'active'
    check (status in ('active', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loans_user_id_idx on public.loans (user_id);
create index if not exists loans_status_idx on public.loans (user_id, status);

alter table public.loans enable row level security;

drop policy if exists "loans_all_own" on public.loans;
create policy "loans_all_own"
  on public.loans for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------ ledger_entries
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  loan_id uuid not null references public.loans (id) on delete cascade,
  entry_type text not null
    check (entry_type in ('disbursement', 'principal_payment', 'interest_payment', 'charge', 'adjustment')),
  amount numeric not null,
  entry_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_user_id_idx on public.ledger_entries (user_id);
create index if not exists ledger_entries_loan_id_idx on public.ledger_entries (loan_id);
create index if not exists ledger_entries_date_idx on public.ledger_entries (user_id, entry_date desc);

alter table public.ledger_entries enable row level security;

drop policy if exists "ledger_all_own" on public.ledger_entries;
create policy "ledger_all_own"
  on public.ledger_entries for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
