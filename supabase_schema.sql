-- ============================================================
-- BeautySureAQL — Complete Schema
-- Run this ONCE in Supabase → SQL Editor → New Query → Run
-- Standard email-confirmation signup (no manual approval)
-- ============================================================

-- Step 1: Drop old trigger first (so it doesn't recreate profiles)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Step 2: Drop old tables cleanly (children first)
drop table if exists inspections             cascade;
drop table if exists admin_approval_requests cascade;
drop table if exists profiles                cascade;
drop table if exists companies               cascade;

-- Step 3: Companies
create table companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text,
  country       text,
  industry      text default 'Cosmetics',
  logo_url      text,
  contact_email text,
  contact_phone text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Step 4: Profiles (extends Supabase auth.users)
create table profiles (
  id            uuid references auth.users primary key,
  company_id    uuid references companies(id),
  emp_id        text,
  full_name     text,
  email         text,
  phone         text,
  role          text check (role in (
                  'platform_admin',
                  'company_admin',
                  'qa_manager',
                  'qa_executive',
                  'demo'
                )) default 'qa_executive',
  status        text check (status in (
                  'active',
                  'suspended'
                )) default 'active',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Step 5: Inspections
create table inspections (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id),
  created_by          uuid references profiles(id),
  status              text check (status in ('draft','submitted','approved','rejected')) default 'draft',
  product_name        text,
  sku                 text,
  batch_no            text,
  batch_size          int,
  sample_size         int,
  sample_letter       text,
  mfd_date            date,
  exp_date            date,
  defect_counts       jsonb default '{}',
  overall_decision    text check (overall_decision in ('ACCEPT','HOLD','REJECT')),
  defect_pct_critical numeric,
  defect_pct_major    numeric,
  defect_pct_minor    numeric,
  remarks             text,
  approved_by         uuid references profiles(id),
  approved_at         timestamptz,
  submitted_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Step 6: Enable Row Level Security
alter table companies   enable row level security;
alter table profiles    enable row level security;
alter table inspections enable row level security;

-- Step 7: RLS — Companies
create policy "Users see own company"
  on companies for select
  using (id = (select company_id from profiles where id = auth.uid()));

create policy "Admin updates own company"
  on companies for update
  using (id = (select company_id from profiles
               where id = auth.uid()
               and role in ('company_admin','platform_admin')));

create policy "Anyone can create a company"
  on companies for insert
  with check (true);

-- Step 8: RLS — Profiles
create policy "Users see same company profiles"
  on profiles for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    or auth.uid() = id
  );

create policy "Admin manages company profiles"
  on profiles for all
  using (
    company_id = (select company_id from profiles
                  where id = auth.uid()
                  and role in ('company_admin','platform_admin'))
  );

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Trigger can insert profile"
  on profiles for insert
  with check (true);

-- Step 9: RLS — Inspections
create policy "Company users see own inspections"
  on inspections for select
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users insert inspections"
  on inspections for insert
  with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users update inspections"
  on inspections for update
  using (
    created_by = auth.uid()
    or (select role from profiles where id = auth.uid())
       in ('company_admin','qa_manager','platform_admin')
  );

-- Step 10: Auto-create profile on signup (standard — no approval gate)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'qa_executive'),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Demo company (fixed UUID — always available)
-- ============================================================
insert into companies (id, name, country, contact_email, industry)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'India',
  'demo@beautysureaql.com',
  'Cosmetics'
) on conflict (id) do nothing;
