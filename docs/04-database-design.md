# Database Design

This document describes the initial Supabase/PostgreSQL schema. Exact SQL migrations will be created in a later implementation issue.

## Shared Enums

Leave statuses:

- `pending`
- `approved`
- `rejected`

Leave types:

- `annual`
- `unpaid`
- `sick`
- `other`

Device statuses:

- `available`
- `assigned`
- `returned`
- `broken`

## profiles

Purpose: Store application profile data linked to Supabase Auth users.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, references `auth.users.id` |
| full_name | text | User display name |
| role | text | `admin_hr`, `manager`, or `employee` |
| is_active | boolean | Defaults to true |
| created_at | timestamptz | Defaults to now |
| updated_at | timestamptz | Updated on profile changes |

Primary key: `id`

Foreign keys:

- `id` references `auth.users(id)`

Important notes:

- RLS should limit profile visibility by role.
- Admin/HR users need access to manage application users.

## employees

Purpose: Store employee master records.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| profile_id | uuid | Optional link to `profiles.id` for future employee portal |
| full_name | text | Required |
| email | text | Required, should be unique |
| phone | text | Optional |
| department | text | Optional |
| position | text | Optional |
| start_date | date | Employment start date |
| employment_status | text | Example: active, inactive, terminated |
| base_salary | numeric(12,2) | Used for simplified salary calculation |
| created_at | timestamptz | Defaults to now |
| updated_at | timestamptz | Updated on employee changes |

Primary key: `id`

Foreign keys:

- `profile_id` references `profiles(id)`

Important notes:

- Salary data is sensitive and should be restricted with RLS.
- Email should be indexed for search and uniqueness.

## leave_requests

Purpose: Track employee leave requests.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| employee_id | uuid | Required |
| leave_type | text | `annual`, `unpaid`, `sick`, `other` |
| start_date | date | Required |
| end_date | date | Required |
| total_days | numeric(5,2) | Required |
| status | text | `pending`, `approved`, `rejected` |
| reason | text | Optional |
| reviewed_by | uuid | References reviewer profile |
| reviewed_at | timestamptz | Set when approved or rejected |
| created_at | timestamptz | Defaults to now |
| updated_at | timestamptz | Updated on changes |

Primary key: `id`

Foreign keys:

- `employee_id` references `employees(id)`
- `reviewed_by` references `profiles(id)`

Important notes:

- Default status should be `pending`.
- Approved unpaid leave should affect salary estimation.

## salary_records

Purpose: Store simplified monthly salary calculations.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| employee_id | uuid | Required |
| salary_month | integer | 1-12 |
| salary_year | integer | Four-digit year |
| base_salary | numeric(12,2) | Snapshot from employee record |
| unpaid_leave_days | numeric(5,2) | Total unpaid leave days |
| daily_wage | numeric(12,2) | `base_salary / 30` |
| deduction_amount | numeric(12,2) | `unpaid_leave_days * daily_wage` |
| calculated_salary | numeric(12,2) | `base_salary - deduction_amount` |
| calculated_by | uuid | Profile that created the record |
| created_at | timestamptz | Defaults to now |

Primary key: `id`

Foreign keys:

- `employee_id` references `employees(id)`
- `calculated_by` references `profiles(id)`

Important notes:

- Formula: Daily wage = base_salary / 30; Deduction = unpaid_leave_days * daily_wage; Calculated salary = base_salary - deduction.
- This is an internal estimation module, not legal payroll.

## devices

Purpose: Store company device inventory.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | Device name |
| device_type | text | Example: laptop, phone, monitor |
| serial_number | text | Should be unique when available |
| status | text | `available`, `assigned`, `returned`, `broken` |
| notes | text | Optional |
| created_at | timestamptz | Defaults to now |
| updated_at | timestamptz | Updated on changes |

Primary key: `id`

Foreign keys: none

Important notes:

- Status should reflect the latest assignment state.
- Serial number should be indexed if used.

## device_assignments

Purpose: Track which employee has which device and when.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| device_id | uuid | Required |
| employee_id | uuid | Required |
| assigned_at | date | Required |
| returned_at | date | Optional |
| assigned_by | uuid | Profile that assigned device |
| notes | text | Optional |
| created_at | timestamptz | Defaults to now |

Primary key: `id`

Foreign keys:

- `device_id` references `devices(id)`
- `employee_id` references `employees(id)`
- `assigned_by` references `profiles(id)`

Important notes:

- Active assignments have no `returned_at`.
- Device status should be updated when assignment changes.

## documents

Purpose: Store metadata for files uploaded to Supabase Storage.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| employee_id | uuid | Optional depending on document type |
| document_type | text | Example: cv, invoice, contract, other |
| file_name | text | Original or display file name |
| storage_bucket | text | Supabase Storage bucket |
| storage_path | text | Path inside bucket |
| uploaded_by | uuid | Profile that uploaded file |
| created_at | timestamptz | Defaults to now |

Primary key: `id`

Foreign keys:

- `employee_id` references `employees(id)`
- `uploaded_by` references `profiles(id)`

Important notes:

- Storage policies must match document access rules.
- Do not store secret URLs in the database.

## audit_logs

Purpose: Record important system actions for traceability.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| actor_id | uuid | Profile that performed the action |
| action | text | Example: create, update, approve, reject, assign, upload |
| entity_table | text | Related table name |
| entity_id | uuid | Related record ID when available |
| metadata | jsonb | Optional extra details |
| created_at | timestamptz | Defaults to now |

Primary key: `id`

Foreign keys:

- `actor_id` references `profiles(id)`

Important notes:

- Audit logs should be append-only where possible.
- RLS should restrict audit log visibility to Admin/HR users.
