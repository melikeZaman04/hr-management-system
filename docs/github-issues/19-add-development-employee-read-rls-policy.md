# Add development employee read RLS policy

Labels: `type: backend`, `type: database`, `type: security`, `priority: high`, `status: ready`

Milestone: Supabase Foundation

## Description

Add a clearly marked development-only RLS policy script that allows the React
Employees page to read fake employee seed data while the real Auth and Admin/HR
role policies are still pending.

This policy must not be presented as production-safe.

## Learning Goal

Understand how Supabase Row Level Security affects frontend reads:

- RLS can block a query even when the table exists and has rows
- React uses the anon role before authentication is implemented
- Temporary development policies are different from production policies
- HR data should not be exposed publicly in a real environment

## Acceptance Criteria

- [ ] Development-only RLS SQL file exists
- [ ] Policy is clearly marked as unsafe for production HR data
- [ ] Setup guide explains when and why to apply it
- [ ] Setup guide explains how to remove or replace it later
- [ ] No private keys or secrets are committed
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
