# Connect employee list page to Supabase

Labels: `type: frontend`, `type: backend`, `type: feature`, `priority: high`, `status: ready`

Milestone: Employee Management

## Description

Connect the Employees page to the Supabase `employees` table and replace the
placeholder content with a real read-only employee list.

This is the first vertical feature slice after the planning, Supabase
foundation, and React foundation work. It should prove that the frontend can
read data from Supabase through the configured client.

## Learning Goal

Understand how a React page loads external data:

- Component state for loading, success, empty, and error states
- Supabase query structure
- TypeScript types for database records
- Keeping data access code maintainable
- Protecting secrets by using only `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`

## Implementation Notes

- Use the existing `src/lib/supabaseClient.ts` client.
- Query the `employees` table.
- Show employee name, email, department, position, status, and base salary.
- Add a loading state while the query is running.
- Add an empty state when no employees exist.
- Add an error state when the query fails.
- Keep the first version read-only. Employee creation will be handled in a later
  issue.

## Acceptance Criteria

- [ ] Employees page reads records from the Supabase `employees` table
- [ ] Loading state is displayed while data is being fetched
- [ ] Empty state is displayed when there are no employee records
- [ ] Error state is displayed when the Supabase query fails
- [ ] Employee list displays key employee fields
- [ ] No service role key or private secret is used in frontend code
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
