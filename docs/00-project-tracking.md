# Project Tracking

GitHub repository: https://github.com/melikeZaman04/hr-management-system

This project will be developed issue by issue. Each step should connect local work,
GitHub Issues, branches, pull requests, and documentation.

## Current GitHub Status

Checked on 2026-05-21.

- #1 Create initial README: closed
- #2 Define project scope and objectives: closed
- #3 Define system modules: closed
- #4 Define user roles and permissions: closed
- #5 Design initial Supabase database schema: closed
- #6 Plan initial UI flow: closed
- #7 Create development roadmap: closed
- #8 Setup GitHub workflow documentation: closed
- #9 Plan Supabase foundation: closed
- #10 Plan React foundation: closed
- #15 Connect employee list page to Supabase: closed
- #17 Prepare Supabase schema and employee seed data: closed
- #19 Add development employee read RLS policy: closed
- #23 Development employee okuma izni icin anon grantlerini dokumante et: closed
- #25 Connect employee detail page to Supabase: closed
- #27 Supabase Auth login/logout ve protected routes ekle: open

## Pull Request Status

- #11 docs: add project planning foundation: merged
- #12 docs: plan supabase foundation: merged
- #13 chore: initialize react foundation: merged
- #14 docs: plan supabase foundation: merged
- #16 feat: connect employee list to Supabase: merged
- #18 docs: prepare Supabase schema and seed workflow: merged
- #20 docs: add development employee read RLS policy: merged
- #22 docs: clean project presentation: merged
- #24 docs: document anon grants for employee reads: merged
- #26 feat: connect employee detail to Supabase: merged

## Working Method

For each issue:

1. Read the issue goal and acceptance criteria.
2. Compare the issue with the current repository state.
3. Explain the purpose of the work before implementing it.
4. Make a focused branch or continue the matching feature branch.
5. Implement only the scope of that issue.
6. Run lint/build checks when relevant.
7. Update documentation if the behavior or setup changes.
8. Open or update the matching pull request.
9. Close the issue only after acceptance criteria are met.

## Next Recommended Step

Work on issue #27 by adding Supabase Auth login/logout and protected routes.
After this, connect `profiles` roles to the authenticated user and replace the
development-only RLS policy with Admin/HR and Employee role policies.
