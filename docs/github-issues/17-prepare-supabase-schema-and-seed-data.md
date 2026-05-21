# Prepare Supabase schema and employee seed data

Labels: `type: backend`, `type: database`, `type: documentation`, `priority: high`, `status: ready`

Milestone: Supabase Foundation

## Description

Prepare the project for applying the existing Supabase schema to a real
Supabase project and add safe seed data for testing the employee list feature.

This issue should not commit any Supabase project URL, anon key, service role
key, database password, or private secret.

## Learning Goal

Understand how the frontend depends on the backend data model:

- Why database schema comes before real data integration
- How seed data helps test frontend states
- Why frontend code must only use public anon credentials
- Why private service role keys never belong in React code
- How RLS can affect frontend queries

## Implementation Notes

- Add a setup guide for applying `docs/supabase/02-database-schema.sql`.
- Add a seed SQL file with sample `employees` rows.
- Keep seed data fake and safe.
- Explain how to verify the Employees page after adding `.env.local`.
- Mention that RLS policies may block reads until policies are added or adjusted.

## Acceptance Criteria

- [ ] Supabase schema application steps are documented
- [ ] Employee seed SQL file exists
- [ ] Seed data uses fake, non-sensitive records
- [ ] Verification steps for React Employees page are documented
- [ ] Secret handling rules are documented
- [ ] RLS caveat is documented
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
