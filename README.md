# HR Management System

HR Management System is a web-based human resources management platform built with React and Supabase. The system aims to manage employee records, leave requests, salary calculations based on unpaid leave, and device assignment tracking from a centralized dashboard.

## Current Status

Status: Employee list foundation ready for Supabase verification.

Completed so far:

- Project planning and GitHub workflow documentation
- Supabase schema planning and SQL baseline
- React, Vite, TypeScript, and React Router foundation
- Shared layout with sidebar/header navigation
- MVP placeholder pages
- Supabase client configuration
- Read-only Employees page connected through a feature service
- Fake employee seed data for development verification
- Development-only employee read RLS policy for fake data

## Project Purpose

The purpose of this project is to build a clean, maintainable HR management system that can be developed as a real software project. The repository will use GitHub Issues, labels, milestones, branches, pull requests, and documentation from the beginning.

The first version is focused on an Admin/HR-centered panel. Manager and employee portals are planned for later stages.

## Core Modules

- Employee Management: create, list, view, and maintain employee records.
- Leave Management: track leave requests and approval status.
- Salary Calculation: estimate monthly salary deductions based on unpaid leave.
- Device / Assignment Management: manage company devices and employee assignments.
- Document Management: store CVs, invoices, and HR-related files.
- Role-Based Access Control: separate access for Admin/HR, Manager, and Employee roles.
- Audit / Activity Logs: track important system actions.

## Technology Stack

- React
- Vite
- TypeScript
- React Router
- Supabase
- Supabase JS client
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Later: Supabase Edge Functions if needed

## Planned Architecture

The application will use React as the frontend client and Supabase as the backend platform. Supabase will provide authentication, PostgreSQL database tables, file storage, and Row Level Security policies.

The frontend will communicate with Supabase through a dedicated client configuration and page-level data flows. Sensitive access rules should be enforced through Supabase RLS, not only through frontend UI checks.

Current frontend structure:

```txt
src/
  app/                 Router and application shell
  components/          Shared layout and UI components
  features/            Feature-level data access and business logic
  layouts/             Page layout wrappers
  lib/                 External client configuration
  pages/               Route-level pages
  styles/              Global styles
```

Current data flow:

```txt
React page -> feature service -> Supabase client -> Supabase API -> PostgreSQL
```

## Supabase Foundation

The backend foundation is planned under `docs/supabase/`. This includes the Supabase setup plan, initial PostgreSQL schema, Row Level Security strategy, Storage plan, and Auth strategy.

No Supabase keys, service role keys, database passwords, or real environment secrets should be committed to this repository.

To apply the schema and add fake employee records for local verification, follow
`docs/supabase/06-apply-schema-and-seed.md`.

Development verification SQL files:

- `docs/supabase/02-database-schema.sql`
- `docs/supabase/seed-employees.sql`
- `docs/supabase/dev-only-employee-read-policy.sql`

## Frontend Setup

The frontend foundation uses Vite, React, TypeScript, React Router, and the Supabase JS client.

Install dependencies:

```bash
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Set these values locally:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only the Supabase project URL and anon public key should be used in the frontend. Do not commit `.env.local`, service role keys, database passwords, or any private credentials.

Run the local development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

## Initial MVP Scope

Core MVP features:

- Admin login
- Employee creation and listing
- Employee detail page
- Leave request tracking
- Leave approval/rejection flow
- Simple salary calculation based on unpaid leave
- Device creation and assignment to employees
- CV and invoice document storage
- Basic dashboard metrics

## Development Workflow

This project will use:

- GitHub Issues for each task or feature
- Labels for task type, priority, status, and technical area
- Milestones for project phases
- Feature branches for implementation work
- Pull requests for review before merging
- Documentation updates alongside technical changes

Example branch names:

- `feature/1-initial-readme`
- `feature/5-database-schema`
- `feature/10-react-foundation`

## Useful Documentation

- `docs/00-project-tracking.md`
- `docs/01-project-scope.md`
- `docs/02-system-modules.md`
- `docs/03-user-roles-and-permissions.md`
- `docs/04-database-design.md`
- `docs/05-ui-flow.md`
- `docs/06-development-roadmap.md`
- `docs/07-github-workflow.md`
- `docs/supabase/06-apply-schema-and-seed.md`
- `docs/supabase/07-auth-login-setup.md`

## Project Status

The repository now includes the planning foundation, Supabase setup workflow,
React foundation, and the first Employee Management read-only list flow. The
next product step is to implement authenticated Admin/HR access and replace the
development-only RLS policy with production-safe policies.
