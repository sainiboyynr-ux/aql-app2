-- ============================================================
-- ESME AQL App — Supabase Schema
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Profiles (extends Supabase auth users)
create table if not exists profiles (
  id uuid references auth.users primary key,
  emp_id text unique not null,
  full_name text,
  role text check (role in ('qa_executive', 'qa_manager')) default 'qa_executive',
  created_at timestamptz default now()
);

-- Inspections
create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id),
  status text check (status in ('draft','submitted','approved','rejected')) default 'draft',
  product_name text,
  sku text,
  batch_no text,
  batch_size int,
  sample_size int,
  sample_letter text,
  mfd_date date,
  exp_date date,
  defect_counts jsonb default '{}',
  overall_decision text check (overall_decision in ('ACCEPT','HOLD','REJECT')),
  defect_pct_critical numeric,
  defect_pct_major numeric,
  defect_pct_minor numeric,
  remarks text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table inspections enable row level security;
alter table profiles enable row level security;

create policy "Users manage own inspections"
  on inspections for all using (auth.uid() = created_by);

create policy "All users view submitted"
  on inspections for select using (status != 'draft' or auth.uid() = created_by);

create policy "Users read all profiles"
  on profiles for select using (true);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, emp_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'emp_id', new.email),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'qa_executive')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
