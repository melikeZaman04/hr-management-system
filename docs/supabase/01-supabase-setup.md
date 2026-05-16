# Supabase Setup Plan

This document describes how the Supabase backend foundation will be prepared for the HR Management System. It is a planning document only. No Supabase keys, project secrets, or real environment values should be committed to the repository.

## Project Creation

The Supabase project should be created from the Supabase dashboard by the project owner or authorized team member.

Recommended setup steps:

1. Create a new Supabase project.
2. Select the closest appropriate region for the expected users.
3. Store the database password securely outside the repository.
4. Configure authentication settings for the Admin/HR MVP.
5. Create database tables using reviewed SQL migrations.
6. Configure private Storage buckets.
7. Enable and test Row Level Security policies before using production data.

## Supabase Services

The MVP will use the following Supabase services.

### Database

Supabase PostgreSQL will store structured HR data:

- User profiles and roles
- Employee records
- Leave requests
- Salary calculation records
- Device inventory
- Device assignment history
- Document metadata
- Audit/activity logs

The initial schema is documented in `docs/supabase/02-database-schema.sql`.

### Auth

Supabase Auth will provide login and session management.

The first MVP is Admin/HR focused. Manager and Employee accounts should be considered in the data model, but their full portals can be implemented later.

### Storage

Supabase Storage will store files such as:

- CV files
- Employee documents
- Device invoices
- Assignment documents

Storage buckets should be private by default, with access controlled through policies and signed URLs where appropriate.

### Row Level Security

Row Level Security should be enabled on application tables before sensitive data is used. RLS is the main backend protection layer for employee data, salary data, documents, and audit logs.

Frontend route protection is useful for user experience, but it is not a substitute for database-level access control.

### Edge Functions

Supabase Edge Functions are not required for the first planning step. They may be used later for backend-only logic such as:

- Advanced salary calculation workflows
- Secure document processing
- Notification dispatch
- Scheduled audit or reporting tasks

## Environment Variable Strategy

The frontend should only use public Supabase values that are safe for browser use:

- Supabase project URL
- Supabase anon public key

These values should be placed in local environment files such as `.env.local` when the React app is created later. Example environment files may be documented, but real secrets must not be committed.

Never commit:

- Supabase service role key
- Database password
- JWT secret
- Private API keys
- Production credentials

## Security Notes

- Keep the service role key server-side only.
- Do not expose privileged keys in React code.
- Keep Storage buckets private by default.
- Use RLS policies for all sensitive tables.
- Separate authentication profiles from employee records.
- Use audit logs for important HR actions.
- Review policies before adding real employee or salary data.
