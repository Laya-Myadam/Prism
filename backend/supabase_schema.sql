-- PRISM Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jwpzknordagzjkdgxdfz/sql/new

create table if not exists rfis (
  id          text primary key,
  session_id  text not null,
  subject     text,
  description text,
  status      text default 'Open',
  priority    text default 'Medium',
  submitted_by text default 'GC',
  assigned_to  text default 'Architect',
  date_submitted text,
  date_due    text,
  response    text,
  date_responded text,
  days_open   integer default 0,
  created_at  timestamptz default now()
);

create table if not exists change_orders (
  id          text primary key,
  session_id  text not null,
  title       text,
  description text,
  amount      numeric default 0,
  status      text default 'Pending',
  submitted_by text,
  reason      text,
  assessment  jsonb,
  created_at  timestamptz default now()
);

create table if not exists obligations (
  id          text primary key,
  session_id  text not null,
  description text,
  due_date    text,
  responsible_party text,
  type        text,
  completed   boolean default false,
  created_at  timestamptz default now()
);

create table if not exists punch_items (
  id          text primary key,
  session_id  text not null,
  description text,
  location    text,
  trade       text,
  priority    text default 'Medium',
  status      text default 'Open',
  ball_in_court text default 'Contractor',
  category    text,
  created_at  timestamptz default now()
);

create table if not exists submittals (
  id            text primary key,
  session_id    text not null,
  title         text,
  spec_section  text,
  submitted_by  text,
  reviewer      text,
  status        text default 'Pending Review',
  date_submitted text,
  required_date  text,
  review_deadline text,
  compliance_score numeric,
  flags         jsonb,
  ai_review     text,
  created_at    timestamptz default now()
);

create table if not exists daily_logs (
  id           text primary key,
  session_id   text not null,
  date         text,
  weather      text,
  crew_count   integer default 0,
  labor_hours  numeric default 0,
  work_performed text,
  delays       text,
  incidents    text,
  narrative    text,
  delay_claims jsonb,
  weather_impact text,
  created_at   timestamptz default now()
);

-- Disable RLS for all tables (backend uses service_role key)
alter table rfis          disable row level security;
alter table change_orders disable row level security;
alter table obligations   disable row level security;
alter table punch_items   disable row level security;
alter table submittals    disable row level security;
alter table daily_logs    disable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- CONSTRUCTION — Workers
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists workers (
  id           text primary key,
  session_id   text not null,
  name         text,
  trade        text,
  role         text,
  company      text,
  phone        text,
  email        text,
  status       text default 'Active',
  start_date   text,
  daily_rate   numeric default 0,
  created_at   timestamptz default now()
);
alter table workers disable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROPERTY MANAGEMENT
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists leases (
  id                 text primary key,
  session_id         text not null,
  property_address   text,
  tenant_name        text,
  lease_start        text,
  lease_end          text,
  monthly_rent       numeric default 0,
  security_deposit   numeric default 0,
  rent_escalation    text,
  cam_included       boolean default false,
  cam_cap            text,
  renewal_options    text,
  termination_clause text,
  ti_allowance       numeric default 0,
  permitted_use      text,
  ai_summary             text,
  status                 text default 'Active',
  extraction_confidence  text default 'Medium',
  created_at             timestamptz default now()
);
alter table leases disable row level security;

-- If the leases table already exists, add the extraction_confidence column:
alter table leases add column if not exists extraction_confidence text default 'Medium';

create table if not exists tenants (
  id           text primary key,
  session_id   text not null,
  name         text,
  unit         text,
  email        text,
  phone        text,
  move_in      text,
  lease_end    text,
  monthly_rent numeric default 0,
  risk_score   text,
  risk_level   text default 'Unknown',
  risk_details text,
  status       text default 'Active',
  created_at   timestamptz default now()
);
alter table tenants disable row level security;

create table if not exists maintenance_requests (
  id              text primary key,
  session_id      text not null,
  unit            text,
  tenant_name     text,
  category        text,
  description     text,
  priority        text default 'Medium',
  status          text default 'Open',
  assigned_to     text,
  date_submitted  text,
  date_due        text,
  date_resolved   text,
  ai_diagnosis    text,
  estimated_cost  numeric default 0,
  created_at      timestamptz default now()
);
alter table maintenance_requests disable row level security;

create table if not exists noi_reports (
  id                   text primary key,
  session_id           text not null,
  property_name        text,
  report_period        text,
  gross_potential_rent numeric default 0,
  vacancy_loss         numeric default 0,
  other_income         numeric default 0,
  effective_gross      numeric default 0,
  operating_expenses   numeric default 0,
  noi                  numeric default 0,
  cap_rate             numeric default 0,
  ai_summary           text,
  ai_recommendations   text,
  created_at           timestamptz default now()
);
alter table noi_reports disable row level security;

create table if not exists cam_reconciliations (
  id              text primary key,
  session_id      text not null,
  property_name   text,
  reconcile_year  text,
  total_cam_pool  numeric default 0,
  total_leasable  numeric default 0,
  tenants_data    jsonb,
  ai_summary      text,
  created_at      timestamptz default now()
);
alter table cam_reconciliations disable row level security;

create table if not exists pm_daily_logs (
  id                  text primary key,
  session_id          text not null,
  property_address    text,
  date                text,
  activities          text,
  maintenance_notes   text,
  tenant_interactions text,
  occupancy_notes     text,
  ai_summary          text,
  created_at          timestamptz default now()
);
alter table pm_daily_logs disable row level security;

create table if not exists unit_turnovers (
  id           text primary key,
  session_id   text not null,
  unit         text not null,
  checked_items jsonb default '[]',
  notes        text default '',
  completed    boolean default false,
  completed_at timestamptz,
  updated_at   timestamptz default now(),
  created_at   timestamptz default now()
);
alter table unit_turnovers disable row level security;

create table if not exists approvals (
  id             text primary key,
  session_id     text not null,
  type           text not null,
  reference_id   text not null,
  title          text,
  description    text,
  status         text default 'Pending',
  requested_by   text default 'Staff',
  review_notes   text,
  reviewed_by    text,
  created_at     timestamptz default now(),
  reviewed_at    timestamptz
);
alter table approvals disable row level security;

create table if not exists projects (
  id          text primary key,
  session_id  text not null,
  name        text,
  client      text,
  value       text,
  status      text default 'On Track',
  completion  integer default 0,
  phase       text default 'Planning',
  rfi         integer default 0,
  workers     integer default 0,
  start_date  text,
  end_date    text,
  created_at  timestamptz default now()
);
alter table projects disable row level security;

create table if not exists schedule_tasks (
  id          text primary key,
  session_id  text not null,
  name        text,
  phase       text,
  start_day   integer default 0,
  duration    integer default 7,
  progress    integer default 0,
  assignee    text,
  status      text default 'Upcoming',
  priority    text default 'medium',
  created_at  timestamptz default now()
);
alter table schedule_tasks disable row level security;

create table if not exists user_settings (
  uid               text primary key,
  session_id        text,
  notifications     boolean default true,
  auto_risk         boolean default true,
  email_alerts      boolean default false,
  updated_at        timestamptz default now()
);
alter table user_settings disable row level security;
