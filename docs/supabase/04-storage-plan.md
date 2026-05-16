# Supabase Storage Plan

Supabase Storage will be used for employee and device-related files. Storage setup should be completed after the database schema and role strategy are reviewed.

## Buckets

### employee-documents

Purpose: Store files related to employee records.

Examples:

- CV files
- Employee documents
- Contracts
- HR forms

Recommended path structure:

```text
employees/{employee_id}/cv/{file_name}
employees/{employee_id}/documents/{file_name}
```

### device-invoices

Purpose: Store files related to company devices and assignments.

Examples:

- Device invoices
- Warranty documents
- Assignment documents
- Return documents

Recommended path structure:

```text
devices/{device_id}/invoices/{file_name}
devices/{device_id}/assignments/{assignment_id}/{file_name}
```

## Privacy Defaults

Buckets should be private by default.

HR files can contain personal, financial, or company asset information. Public buckets should not be used for CVs, employee documents, device invoices, or assignment documents.

## Access Control

File access should be controlled by role:

- Admin/HR can upload and access employee and device documents.
- Managers may later access limited team-related documents if approved.
- Employees may later access selected own documents if approved.

Storage policies should align with database RLS policies. The `documents` table should store metadata such as employee ID, device ID, bucket name, storage path, document type, and uploader.

## File Metadata

The database should store metadata, not secret URLs.

Recommended metadata:

- Document type
- Original file name
- Storage bucket
- Storage path
- Related employee ID
- Related device ID
- Uploaded by
- Created timestamp

## Future Improvements

- File versioning
- Signed URL expiration policy
- Document preview support
- Document review workflow
- File size and type validation
- Virus scanning through a server-side workflow if needed
