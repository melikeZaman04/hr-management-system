-- Fake employee seed data for local development and UI verification.
-- Run this after docs/supabase/02-database-schema.sql.
-- Do not use real personal, salary, or employment data in seed files.

insert into public.employees (
  full_name,
  email,
  phone,
  department,
  position,
  start_date,
  employment_status,
  base_salary
) values
  (
    'Aylin Demir',
    'aylin.demir@example.com',
    '+90 555 010 1001',
    'Human Resources',
    'HR Specialist',
    '2024-02-12',
    'active',
    42000.00
  ),
  (
    'Mert Kaya',
    'mert.kaya@example.com',
    '+90 555 010 1002',
    'Engineering',
    'Frontend Developer',
    '2023-09-04',
    'active',
    68000.00
  ),
  (
    'Selin Arslan',
    'selin.arslan@example.com',
    '+90 555 010 1003',
    'Finance',
    'Finance Analyst',
    '2022-11-21',
    'active',
    54000.00
  ),
  (
    'Emre Yildiz',
    'emre.yildiz@example.com',
    '+90 555 010 1004',
    'Operations',
    'Operations Coordinator',
    '2021-06-15',
    'inactive',
    47000.00
  )
on conflict (email) do update set
  phone = excluded.phone,
  department = excluded.department,
  position = excluded.position,
  start_date = excluded.start_date,
  employment_status = excluded.employment_status,
  base_salary = excluded.base_salary,
  updated_at = now();
