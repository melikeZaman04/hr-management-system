-- Initial Supabase PostgreSQL schema for the HR Management System.
-- This schema is intended as a planning baseline and should be reviewed
-- before being applied to a real Supabase project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'admin_hr',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin_hr', 'manager', 'employee'))
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  department text,
  position text,
  start_date date,
  employment_status text not null default 'active',
  base_salary numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_employment_status_check check (
    employment_status in ('active', 'inactive', 'terminated')
  ),
  constraint employees_base_salary_check check (base_salary >= 0)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  total_days numeric(5,2) not null,
  status text not null default 'pending',
  reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_type_check check (leave_type in ('annual', 'unpaid', 'sick', 'other')),
  constraint leave_requests_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint leave_requests_total_days_check check (total_days > 0),
  constraint leave_requests_date_range_check check (end_date >= start_date)
);

create table if not exists public.salary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  month integer not null,
  year integer not null,
  base_salary numeric(12,2) not null,
  unpaid_leave_days numeric(5,2) not null default 0,
  deduction_amount numeric(12,2) not null default 0,
  calculated_salary numeric(12,2) not null,
  calculated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salary_records_month_check check (month between 1 and 12),
  constraint salary_records_year_check check (year >= 2000),
  constraint salary_records_base_salary_check check (base_salary >= 0),
  constraint salary_records_unpaid_leave_days_check check (unpaid_leave_days >= 0),
  constraint salary_records_deduction_amount_check check (deduction_amount >= 0),
  constraint salary_records_calculated_salary_check check (calculated_salary >= 0),
  constraint salary_records_employee_period_unique unique (employee_id, month, year)
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  device_type text not null,
  serial_number text unique,
  status text not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devices_status_check check (status in ('available', 'assigned', 'returned', 'broken'))
);

create table if not exists public.device_assignments (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  status text not null default 'active',
  assigned_at date not null default current_date,
  returned_at date,
  assigned_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_assignments_status_check check (status in ('active', 'returned')),
  constraint device_assignments_return_date_check check (
    returned_at is null or returned_at >= assigned_at
  )
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  device_id uuid references public.devices(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_type_check check (
    document_type in ('cv', 'employee_document', 'device_invoice', 'assignment_document', 'other')
  ),
  constraint documents_owner_check check (
    employee_id is not null or device_id is not null
  ),
  constraint documents_storage_path_unique unique (storage_bucket, storage_path)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists employees_profile_id_idx on public.employees(profile_id);
create index if not exists employees_department_idx on public.employees(department);
create index if not exists leave_requests_employee_id_idx on public.leave_requests(employee_id);
create index if not exists leave_requests_status_idx on public.leave_requests(status);
create index if not exists salary_records_employee_id_idx on public.salary_records(employee_id);
create index if not exists devices_status_idx on public.devices(status);
create index if not exists device_assignments_device_id_idx on public.device_assignments(device_id);
create index if not exists device_assignments_employee_id_idx on public.device_assignments(employee_id);
create index if not exists documents_employee_id_idx on public.documents(employee_id);
create index if not exists documents_device_id_idx on public.documents(device_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_table, entity_id);

-- RLS should be enabled before using sensitive or production data.
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.leave_requests enable row level security;
alter table public.salary_records enable row level security;
alter table public.devices enable row level security;
alter table public.device_assignments enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;
