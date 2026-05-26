# HRCore

HRCore is a web-based human resources management platform built with React and Supabase. The system aims to manage employee records, leave requests, salary calculations based on unpaid leave, and device assignment tracking from a centralized dashboard.

## Current Status

Status: Auth-protected MVP dashboard with Supabase-backed employee, leave, salary, device, and document flows.

Completed so far:

- Project planning and GitHub workflow documentation
- Supabase schema planning and SQL baseline
- React, Vite, TypeScript, and React Router foundation
- Shared layout with sidebar/header navigation
- MVP application pages
- Supabase client configuration
- Read-only Employees page connected through a feature service
- Fake employee seed data for development verification
- Supabase Auth login/logout and protected routes
- Profile-based Admin/HR, Manager, and Employee route guards
- Employee creation flow backed by Supabase
- Device inventory, device creation, assignment, and return flows backed by Supabase
- Leave request creation and manager approval/rejection flow backed by Supabase
- Salary calculation records backed by Supabase
- Document upload/download flow backed by Supabase Storage
- CSV exports for dashboard, employees, leave requests, salary records, devices, and documents
- SQL helpers for first Admin/HR profile bootstrap and fake device seed data

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

Supabase provides authentication, PostgreSQL database tables, file storage, and Row Level Security (RLS) policies.

No Supabase keys, service role keys, database passwords, or real environment secrets should be committed to this repository.

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

## Project Status

The repository now includes the planning foundation, Supabase setup workflow,
React foundation, authenticated role-based access, and the core MVP workflows.
The remaining release step is manual Supabase verification: apply production RLS
and storage policies, bootstrap the first Admin/HR profile, seed demo data if
needed, then smoke test the live project end to end.
