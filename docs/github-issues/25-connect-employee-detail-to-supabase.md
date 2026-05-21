# Connect employee detail page to Supabase

Labels: `type: frontend`, `type: backend`, `type: feature`, `priority: high`, `status: ready`

Milestone: Employee Management

## Description

Connect the Employee Detail page to the Supabase `employees` table. The page
should use the `id` route parameter from `/employees/:id` and load a single
employee record.

## Learning Goal

Understand the list-to-detail pattern:

- Read a route parameter with React Router
- Query a single Supabase row by `id`
- Handle loading, error, and not-found states
- Display a record in a structured detail layout
- Keep page code separate from feature data access code

## Acceptance Criteria

- [ ] Employee Detail page reads the `id` URL parameter
- [ ] Page loads one employee from Supabase by `id`
- [ ] Loading state is displayed while data is fetched
- [ ] Error state is displayed when the query fails
- [ ] Not-found state is displayed when no employee exists for the id
- [ ] Employee profile fields are shown in a structured layout
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
