# UI Flow

This document plans the initial React pages. React implementation will be handled in later issues.

## Login

Purpose: Allow Admin/HR users to access the system.

Main components:

- Login form
- Email field
- Password field
- Error message area

Data needed from Supabase:

- Supabase Auth session
- User profile role

Main user actions:

- Enter email and password
- Submit login form
- View validation or authentication errors

## Dashboard

Purpose: Provide a summary of HR activity and key metrics.

Main components:

- Metric cards
- Recent leave requests
- Recent employee additions
- Device status summary

Data needed from Supabase:

- Employee count
- Pending leave request count
- Assigned device count
- Recent audit log entries

Main user actions:

- View metrics
- Navigate to main modules
- Review recent activity

## Employees

Purpose: List employees and allow Admin/HR users to create or find employee records.

Main components:

- Employee table
- Search input
- Filter controls
- Create employee button

Data needed from Supabase:

- Employee records
- Department and status values

Main user actions:

- View employee list
- Search employees
- Create employee
- Open employee detail page

## Employee Detail

Purpose: Show complete information for a single employee.

Main components:

- Employee profile section
- Leave history
- Salary record summary
- Assigned devices
- Documents list

Data needed from Supabase:

- Employee record
- Related leave requests
- Related salary records
- Related device assignments
- Related documents

Main user actions:

- View employee details
- Review leave history
- View salary estimates
- View assigned devices
- Access employee documents

## Leave Requests

Purpose: Track and manage employee leave requests.

Main components:

- Leave request table
- Status filter
- Leave type filter
- Approval/rejection controls

Data needed from Supabase:

- Leave request records
- Employee names
- Reviewer profile data

Main user actions:

- View pending requests
- Approve request
- Reject request
- Filter by status or leave type

## Salary Calculation

Purpose: Estimate monthly salary after unpaid leave deductions.

Main components:

- Employee selector
- Month/year selector
- Unpaid leave summary
- Calculation result panel
- Save salary record action

Data needed from Supabase:

- Employee base salary
- Approved unpaid leave requests
- Existing salary records

Main user actions:

- Select employee and month
- Review unpaid leave days
- Calculate salary
- Save salary record

## Devices

Purpose: Manage company devices and employee assignments.

Main components:

- Device table
- Device status filter
- Create device form
- Assignment action
- Return action

Data needed from Supabase:

- Device records
- Employee list
- Device assignment records

Main user actions:

- Create device
- Assign device to employee
- Mark device as returned
- View assignment history

## Documents

Purpose: Manage employee-related files such as CVs and invoices.

Main components:

- Upload form
- Document type selector
- Employee selector
- Document list
- Download/open action

Data needed from Supabase:

- Document metadata
- Employee records
- Supabase Storage file paths

Main user actions:

- Upload document
- Link document to employee
- View document list
- Open or download document
