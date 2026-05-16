# Authentication Strategy

Supabase Auth will provide user authentication for the HR Management System. The first MVP will focus on Admin/HR login, while Manager and Employee access will be planned for later phases.

## Supabase Auth Usage

Supabase Auth will manage:

- User sign-in
- User sessions
- Password handling
- Auth user IDs
- Session refresh

The React frontend should use the Supabase client with the public anon key only. Authorization decisions must still be enforced through Row Level Security policies.

## Admin/HR First MVP Login

The first MVP should allow Admin/HR users to log in and use the HR dashboard.

Initial access approach:

- Create Admin/HR accounts through Supabase Auth.
- Create matching rows in the `profiles` table.
- Set the profile `role` field to `admin_hr`.
- Use RLS policies to allow Admin/HR users to access MVP data.

## Future Manager and Employee Login

Manager and Employee roles are planned for later stages.

Future access approach:

- Managers receive profiles with role `manager`.
- Employees receive profiles with role `employee`.
- Manager access is scoped to assigned team members.
- Employee access is scoped to the employee's own records.

## profiles and auth.users Relationship

The `profiles` table should use the Supabase Auth user ID as its primary key:

```sql
id uuid primary key references auth.users(id) on delete cascade
```

This allows the application to attach role and profile metadata to authenticated users without modifying Supabase's internal Auth tables.

## Role Field

The `profiles.role` field defines application-level access.

Planned values:

- `admin_hr`
- `manager`
- `employee`

RLS policies should use this role to decide what each authenticated user can read or modify.

## Why Auth and Employee Records Are Separate

Authentication users and employee records should be separated because not every employee record needs login access immediately.

Benefits:

- Admin/HR can create employee records before employee portal accounts exist.
- Former employees can remain in HR records without active login access.
- Contractors or device owners can be tracked without Auth accounts if needed.
- User login access can be disabled without deleting HR history.
- Role and permission management stays separate from employee profile details.
