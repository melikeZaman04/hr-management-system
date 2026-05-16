# System Modules

## Employee Management

Purpose: Maintain the main employee records used across the system.

Main features:

- Create employees
- List employees
- View employee details
- Store job, department, contact, salary, and status information

Required data:

- Full name
- Email
- Phone
- Department
- Position
- Start date
- Employment status
- Base salary

Future improvements:

- Employee profile editing history
- Advanced filters
- Import/export
- Employee self-service profile updates

## Leave Management

Purpose: Track employee leave requests and approval status.

Main features:

- Create leave requests
- Review pending requests
- Approve or reject requests
- Track leave type and date ranges

Required data:

- Employee
- Leave type
- Start date
- End date
- Total days
- Status
- Reason

Future improvements:

- Manager approval flow
- Leave balance tracking
- Calendar view
- Notification emails

## Salary Calculation

Purpose: Estimate monthly salary after unpaid leave deductions.

Main features:

- Store base salary
- Track unpaid leave days
- Calculate deduction
- Store calculated salary records

Required data:

- Employee
- Month
- Year
- Base salary
- Unpaid leave days
- Deduction amount
- Calculated salary

Future improvements:

- Bonuses and allowances
- Tax-aware payroll integrations
- Exportable salary reports
- Approval workflow for salary records

## Device Assignment Management

Purpose: Track company devices and their assignment to employees.

Main features:

- Create device records
- Assign devices to employees
- Track return dates
- Monitor device status

Required data:

- Device name
- Device type
- Serial number
- Status
- Assigned employee
- Assignment date
- Return date

Future improvements:

- Maintenance history
- Asset depreciation
- Barcode or QR tracking
- Device document attachments

## Document Management

Purpose: Store employee-related documents in Supabase Storage.

Main features:

- Upload CV files
- Upload invoice files
- Link documents to employees
- Track document type and file path

Required data:

- Employee
- Document type
- File name
- Storage path
- Upload date
- Uploaded by

Future improvements:

- Document versioning
- Access review workflow
- Expiration reminders
- Preview support

## Authentication and Authorization

Purpose: Secure the application and control access by role.

Main features:

- Admin/HR login
- User profiles linked to Supabase Auth
- Role-based UI access
- Supabase Row Level Security policies

Required data:

- Auth user ID
- Email
- Role
- Profile status

Future improvements:

- Manager and Employee portals
- Fine-grained permissions
- Multi-factor authentication
- Invitation-based onboarding

## Audit Logs

Purpose: Record important system actions for traceability.

Main features:

- Log create, update, approve, reject, assign, and upload actions
- Store actor, action, table name, record ID, and timestamp
- Support basic activity review

Required data:

- Actor user
- Action
- Entity/table name
- Entity ID
- Metadata
- Created date

Future improvements:

- Advanced filtering
- Immutable audit policies
- Exportable audit reports
- Alerting for sensitive actions
