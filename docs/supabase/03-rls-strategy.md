# Row Level Security Strategy

Row Level Security is the main backend access-control layer for the HR Management System. The first MVP is Admin/HR focused, but policies should be planned so Manager and Employee roles can be added later without redesigning the database.

## Why RLS Is Important

React frontend checks can hide pages and buttons, but they do not protect database rows by themselves. RLS ensures that Supabase PostgreSQL enforces access rules for every request made with user credentials.

RLS is especially important because this system stores sensitive HR data, including employee profiles, salary information, documents, leave history, and audit logs.

## Roles

### Admin / HR

Admin/HR users are the primary MVP users.

Planned access:

- Read and manage employee records
- Read and manage leave requests
- Read and create salary calculation records
- Read and manage devices and assignments
- Upload and access employee and device documents
- Read audit logs

### Manager

Managers are planned for a future stage.

Planned access:

- Read limited employee information for direct team members
- Review leave requests for assigned employees
- Approve or reject leave requests if delegated
- View limited device assignment information for their team

Restrictions:

- No broad access to all employees
- No default access to salary records
- No default access to all documents

### Employee

Employees are planned for a future stage.

Planned access:

- Read their own profile
- Read limited personal employee data
- Create and view their own leave requests
- View selected own documents if allowed
- View assigned devices if allowed

Restrictions:

- No access to other employee records
- No access to salary records for other users
- No access to audit logs
- No administrative updates

## Sensitive Tables

The following tables contain sensitive data and require strict policies:

- `profiles`
- `employees`
- `leave_requests`
- `salary_records`
- `documents`
- `audit_logs`

The following tables are also access-controlled, though some fields may be less sensitive:

- `devices`
- `device_assignments`

## Basic Access Rules

MVP policy direction:

- Admin/HR can manage all application data required for the HR dashboard.
- Non-Admin roles may be present in the schema but do not need full portal access in the first MVP.
- Salary records should be restricted to Admin/HR.
- Audit logs should be restricted to Admin/HR.
- Documents should be private and role-restricted.
- Employees should only access their own records in a future employee portal.
- Managers should only access team-scoped records in a future manager portal.

## Service Role Key Rule

The Supabase service role key bypasses RLS and must never be exposed in frontend code, browser bundles, public repositories, screenshots, or client-side environment files.

Use the service role key only in trusted server-side contexts if needed later, such as Supabase Edge Functions or a secure backend service.

## Storage Security

Storage buckets should not be public by default. CV files, invoices, and employee documents may contain personal or financial information.

Recommended approach:

- Use private buckets.
- Store file metadata in the `documents` table.
- Use Storage policies aligned with application roles.
- Use signed URLs for temporary access when needed.
- Avoid storing permanent public file URLs for private HR documents.
