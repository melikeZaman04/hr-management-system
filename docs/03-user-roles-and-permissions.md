# User Roles and Permissions

## MVP Role Focus

The first MVP will be Admin/HR-focused. Manager and Employee portals should be planned in the system design, but they may be implemented after the initial Admin/HR panel is stable.

## Admin / HR

Admin/HR users can manage the core HR workflow.

Planned permissions:

- Log in to the admin panel
- Create and view employee records
- View employee detail pages
- Manage leave requests
- Approve or reject leave requests
- Run simplified salary calculations
- Create and assign devices
- Upload and view employee documents
- View dashboard metrics
- View audit/activity logs

Sensitive access notes:

- Admin/HR users can access salary and document data.
- RLS policies should restrict this access to approved HR/Admin accounts.
- Supabase service keys must never be exposed in the frontend.

## Manager

Managers are planned for a later stage.

Planned permissions:

- View assigned team members
- Review team leave requests
- Approve or reject leave requests if delegated
- View limited employee data for their team

Restrictions:

- Managers should not access salary records unless explicitly allowed.
- Managers should not access all company documents.
- Managers should not manage global system settings.

## Employee

Employees are planned for a later stage.

Planned permissions:

- View their own profile
- Submit leave requests
- View their own leave request history
- View limited assigned device information
- Upload or view selected personal documents if allowed

Restrictions:

- Employees should not access other employees' records.
- Employees should not access salary records for other users.
- Employees should not approve leave requests.
- Employees should not view audit logs.
