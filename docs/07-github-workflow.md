# GitHub Workflow

## Issues

Every task should have a GitHub Issue before implementation begins. Issues should describe the goal, planned tasks, acceptance criteria, labels, and milestone.

Issue types:

- Documentation tasks
- Frontend tasks
- Backend tasks
- Database tasks
- Security tasks
- Bug fixes
- Refactoring tasks

## Labels

Labels will classify work by type, priority, and status.

Planned labels:

- `type: documentation`
- `type: frontend`
- `type: backend`
- `type: database`
- `type: auth`
- `type: security`
- `type: ui`
- `type: feature`
- `type: bug`
- `type: refactor`
- `priority: high`
- `priority: medium`
- `priority: low`
- `status: ready`
- `status: blocked`

## Milestones

Milestones represent project phases:

1. Project Planning
2. Supabase Foundation
3. React Foundation
4. Employee Management
5. Leave and Salary Management
6. Device Assignment Management
7. Final Review and Documentation

## Project Board Columns

Suggested project board columns:

- Backlog
- Ready
- In Progress
- In Review
- Done
- Blocked

## Branch Naming Convention

Branches should include the type of work, issue number, and short description.

Examples:

- `feature/1-initial-readme`
- `feature/5-database-schema`
- `feature/10-react-foundation`
- `feature/15-employee-list`
- `feature/20-leave-management`
- `feature/25-salary-calculation`
- `feature/30-device-assignment`

## Commit Message Convention

Use clear conventional-style commit messages.

Examples:

- `docs: add initial README`
- `docs: define project scope`
- `feat: create employee list page`
- `feat: implement leave approval flow`
- `fix: correct salary calculation logic`
- `chore: configure supabase client`

## Pull Request Workflow

1. Create an issue for the task.
2. Create a branch from the main branch.
3. Make focused changes for that issue.
4. Update documentation when needed.
5. Open a pull request.
6. Link the related issue in the PR description.
7. Review changes before merging.
8. Merge only after the checklist is complete.

Pull requests should stay focused. Large features should be split into smaller issues and PRs when possible.
