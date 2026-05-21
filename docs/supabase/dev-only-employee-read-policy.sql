-- DEVELOPMENT ONLY: temporary read policy for fake employee seed data.
-- GELISTIRME ICINDIR: fake employee seed datasini okumak icin gecici policy.
--
-- Purpose:
-- Allow the React Employees page to read fake employee records before the
-- real Admin/HR authentication and production RLS policies are implemented.
--
-- Amac:
-- Gercek Admin/HR auth ve production RLS policy'leri gelmeden once React
-- Employees sayfasinin fake employee kayitlarini okuyabilmesini saglamak.
--
-- Do not use this policy with real HR, salary, document, or personal data.
-- Remove or replace it before adding production data.
--
-- Bu policy'yi gercek HR, maas, dokuman veya kisisel veri ile kullanma.
-- Production datasindan once kaldir veya guvenli Admin/HR policy ile degistir.

drop policy if exists "dev_only_read_employees" on public.employees;

grant usage on schema public to anon;
grant select on public.employees to anon;

create policy "dev_only_read_employees"
on public.employees
for select
to anon
using (true);
