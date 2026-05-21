# Apply Schema and Seed Data

This guide explains how to prepare a real Supabase project for the first
Employee Management feature.

Do not commit `.env.local`, Supabase service role keys, database passwords, or
any private credentials.

## Goal

The React Employees page now queries the `employees` table. To verify that page
with real data, the Supabase project needs:

1. The initial database schema
2. Safe fake employee records
3. Public frontend environment variables in `.env.local`

## Step 1: Apply the Schema

Open the Supabase dashboard:

1. Go to the project SQL Editor.
2. Open `docs/supabase/02-database-schema.sql` from this repository.
3. Paste the SQL into the SQL Editor.
4. Review the SQL before running it.
5. Run the SQL.
6. Confirm that the tables are created under the `public` schema.

Expected tables:

- `profiles`
- `employees`
- `leave_requests`
- `salary_records`
- `devices`
- `device_assignments`
- `documents`
- `audit_logs`

## Step 2: Add Fake Employee Records

Open `docs/supabase/seed-employees.sql`, paste it into the SQL Editor, and run
it after the schema has been applied.

The seed file uses fake records only. It is meant for local development and
frontend verification.

## Step 3: Configure React Environment Variables

Create a local `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Set only the public frontend values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is designed for browser use, but it still works with RLS. The
service role key must never be used in React.

## Step 4: Verify the Employees Page

Because the schema enables RLS, the frontend may not be able to read employee
rows immediately after seeding. For fake development data only, you can apply
`docs/supabase/dev-only-employee-read-policy.sql` before verifying the page.

This policy allows unauthenticated frontend reads of the `employees` table. It
is useful for learning and UI verification, but it is not safe for real HR data.
Remove it before adding real employee records or replace it with authenticated
Admin/HR policies.

Bu policy dosyasi Supabase `anon` ve `authenticated` rollerine gecici
development `select` izni de verir. Buradaki iki katman farklidir:

- SQL `grant`, rolun tabloya sorgu atip atamayacagini belirler.
- RLS policy, rol sorgu atabiliyorsa hangi satirlari gorecegini belirler.

Bu nedenle development okuma akisi icin ikisine de ihtiyac vardir. Sadece RLS
policy yazmak yeterli olmayabilir; tablo privilege'i yoksa frontend
`permission denied for table employees` hatasi alir. Login eklendikten sonra
istekler `authenticated` roluyle gidecegi icin development okuma izni bu rolu de
kapsar.

Run the React app:

```bash
npm run dev
```

Open:

```txt
http://localhost:5173/employees
```

Expected result:

- The page shows a loading state first.
- The page then displays the seeded employee records.
- Each employee name links to `/employees/:id`.
- If no records exist, the page shows an empty state.
- If Supabase blocks the query, the page shows an error state.

## RLS Caveat

The schema enables Row Level Security on the tables. RLS is the right security
foundation for HR data, but it also means frontend queries may return no data or
an authorization error until policies are added.

For real users, add explicit policies before storing sensitive data. For early
development, use only fake seed data and document any temporary policy decisions
before applying them. The temporary development policy in
`docs/supabase/dev-only-employee-read-policy.sql` should be removed or replaced
when Auth and Admin/HR role policies are implemented.

## Secret Handling Rules

Never commit:

- `.env.local`
- Supabase service role key
- Database password
- JWT secret
- Production credentials
- Private API keys

React code should only read:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
