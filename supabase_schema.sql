-- ============================================================
-- ESME AQL SaaS Platform — Full Schema
-- Run this FRESH in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. COMPANIES ─────────────────────────────────────────────
create table if not exists companies (
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

-- ── 2. PROFILES (extends Supabase auth.users) ────────────────
create table if not exists profiles (
  id            uuid references auth.users primary key,
  company_id    uuid references companies(id),
  emp_id        text,
  full_name     text,
  email         text,
  phone         text,
  role          text check (role in (
                  'platform_admin',   -- you (sainiboyynr) — superuser
                  'company_admin',    -- approved admin of a company
                  'qa_manager',       -- QA Manager within company
                  'qa_executive',     -- QA Executive within company
                  'demo'              -- demo / read-only account
                )) default 'qa_executive',
  status        text check (status in (
                  'pending_approval', -- admin signup awaiting your approval
                  'active',
                  'suspended'
                )) default 'active',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── 3. ADMIN APPROVAL REQUESTS ───────────────────────────────
create table if not exists admin_approval_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id),
  full_name     text not null,
  email         text not null,
  company_name  text not null,
  company_country text,
  phone         text,
  message       text,
  approval_token text unique default encode(gen_random_bytes(32), 'hex'),
  status        text check (status in ('pending','approved','rejected')) default 'pending',
  reviewed_at   timestamptz,
  created_at    timestamptz default now()
);

-- ── 4. INSPECTIONS ───────────────────────────────────────────
create table if not exists inspections (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid references companies(id),
  created_by            uuid references profiles(id),
  status                text check (status in ('draft','submitted','approved','rejected')) default 'draft',
  product_name          text,
  sku                   text,
  batch_no              text,
  batch_size            int,
  sample_size           int,
  sample_letter         text,
  mfd_date              date,
  exp_date              date,
  defect_counts         jsonb default '{}',
  overall_decision      text check (overall_decision in ('ACCEPT','HOLD','REJECT')),
  defect_pct_critical   numeric,
  defect_pct_major      numeric,
  defect_pct_minor      numeric,
  remarks               text,
  approved_by           uuid references profiles(id),
  approved_at           timestamptz,
  submitted_at          timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── 5. ROW LEVEL SECURITY ────────────────────────────────────
alter table companies               enable row level security;
alter table profiles                enable row level security;
alter table inspections             enable row level security;
alter table admin_approval_requests enable row level security;

-- Companies: users see only their own company
create policy "Users see own company"
  on companies for select
  using (id = (select company_id from profiles where id = auth.uid()));

create policy "Company admin can update own company"
  on companies for update
  using (id = (select company_id from profiles where id = auth.uid()
               and role in ('company_admin','platform_admin')));

-- Profiles: users see only profiles in same company
create policy "Users see profiles in same company"
  on profiles for select
  using (company_id = (select company_id from profiles where id = auth.uid())
         or auth.uid() = id);

create policy "Company admin manages company profiles"
  on profiles for all
  using (
    company_id = (select company_id from profiles where id = auth.uid()
                  and role in ('company_admin','platform_admin'))
  );

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Inspections: users see only their company's inspections
create policy "Company users see own inspections"
  on inspections for select
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users manage own inspections"
  on inspections for insert with check (
    company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users update own inspections"
  on inspections for update
  using (created_by = auth.uid() or
         (select role from profiles where id = auth.uid()) in ('company_admin','qa_manager','platform_admin'));

-- Admin approval requests: only the requester + platform admin see them
create policy "Requester sees own request"
  on admin_approval_requests for select
  using (user_id = auth.uid());

create policy "Anyone can insert approval request"
  on admin_approval_requests for insert with check (true);

-- ── 6. AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'qa_executive'),
    case
      when coalesce(new.raw_user_meta_data->>'role','') = 'company_admin'
      then 'pending_approval'
      else 'active'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 7. DEMO ACCOUNT ──────────────────────────────────────────
-- Run this after creating the demo user in Supabase Auth dashboard:
-- INSERT INTO companies (id, name, country, contact_email)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'DEMO Company', 'India', 'demo@esme.com');
--
-- UPDATE profiles SET
--   role = 'demo', status = 'active', emp_id = 'DEMO',
--   full_name = 'Demo User', company_id = '00000000-0000-0000-0000-000000000001'
-- WHERE email = 'demo@esmeqa.com';

-- ── 8. PLATFORM ADMIN (YOU) ───────────────────────────────────
-- After creating your own account, run:
-- UPDATE profiles SET role = 'platform_admin', status = 'active'
-- WHERE email = 'sainiboyynr@zohomail.in';
