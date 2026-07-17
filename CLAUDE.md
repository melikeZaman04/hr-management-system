# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HRCore** — İnsan Kaynakları Yönetim Sistemi (HR Management System). A React 19 + TypeScript SPA backed by Supabase (PostgreSQL, Auth, Storage). Features role-based access control across five business modules: employees, leave requests, salary, devices, and documents.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

Run individual Supabase validation scripts from `scripts/`:
```bash
node scripts/supabase-live-check.mjs          # Basic connectivity
node scripts/supabase-auth-check.mjs          # Auth roles
node scripts/supabase-rls-boundary-check.mjs  # RLS policies
```

## Environment

Copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

### Layer Structure

```
src/
├── app/            # Router (router.tsx) + root App.tsx with AuthProvider
├── features/       # Business logic — one folder per domain
│   └── auth/       # AuthProvider, ProtectedRoute, profileService, useAuth
├── pages/          # Page-level components (route targets)
├── components/
│   ├── layout/     # AppShell, Header, Sidebar
│   └── ui/         # Shared primitives: Button, Modal, Panel, StatCard…
├── layouts/        # AppLayout (wraps pages in AppShell)
└── lib/            # supabaseClient.ts, exportCsv.ts
```

### Data Access Pattern

All Supabase calls live in `src/features/<domain>/<domain>Service.ts`. Pages import service functions directly — there is no global state manager (no Redux, Zustand, etc.). Auth state is the only global context, provided by `AuthProvider` and consumed via `useAuth`.

### Auth & Role Model

Three roles defined in the `profiles` table: `admin_hr`, `manager`, `employee`. `ProtectedRoute` in `src/features/auth/ProtectedRoute.tsx` enforces role-based access. Row Level Security policies on every Supabase table are the enforcement layer — the frontend role checks are UX-only.

### Database (Supabase cloud)

Key tables: `profiles`, `employees`, `leave_requests`, `salary_records`, `devices`, `device_assignments`, `documents`. All schema changes are made through the Supabase dashboard, not local migration files. The `scripts/` directory contains smoke tests to verify RLS boundaries after schema changes.

## CI

GitHub Actions runs on every PR and push to `main`: installs deps → `npm run lint` → `npm run build`. No test suite — functional correctness is validated via the Supabase scripts.

## Branch Naming

`feature/<issue-number>-short-description` (e.g. `feature/32-github-polish`). Main integration branch is `feature/1-project-planning-foundation`.
