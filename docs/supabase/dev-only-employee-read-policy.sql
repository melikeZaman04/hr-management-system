-- DEVELOPMENT ONLY: temporary read policy for fake employee seed data.
--
-- Purpose:
-- Allow the React Employees page to read fake employee records before the
-- real Admin/HR authentication and production RLS policies are implemented.
--
-- Do not use this policy with real HR, salary, document, or personal data.
-- Remove or replace it before adding production data.

drop policy if exists "dev_only_read_employees" on public.employees;

create policy "dev_only_read_employees"
on public.employees
for select
to anon
using (true);
