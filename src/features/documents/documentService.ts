import { supabase } from '../../lib/supabaseClient'

// Mirrors public.documents schema exactly.
export type Document = {
  id: string
  employee_id: string | null
  device_id: string | null
  document_type: 'cv' | 'employee_document' | 'device_invoice' | 'assignment_document' | 'other'
  file_name: string
  storage_bucket: string
  storage_path: string
  uploaded_by: string | null   // profiles.id UUID
  created_at: string
  updated_at: string
}

// Schema enum to human-readable label mapping for the UI.
export const DOCUMENT_TYPE_LABELS: Record<Document['document_type'], string> = {
  cv: 'CV',
  employee_document: 'Çalışan dokümanı',
  device_invoice: 'Cihaz faturası',
  assignment_document: 'Atama dokümanı',
  other: 'Diğer',
}

export const EMPLOYEE_DOC_BUCKET = 'employee-documents'
export const DEVICE_DOC_BUCKET   = 'device-invoices'

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getDocuments(filters?: {
  employee_id?: string
  document_type?: string
}) {
  let q = client()
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.employee_id && filters.employee_id !== 'all') {
    q = q.eq('employee_id', filters.employee_id)
  }
  if (filters?.document_type && filters.document_type !== 'all') {
    q = q.eq('document_type', filters.document_type)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Document[]
}

export async function getDocumentsForEmployee(employeeId: string) {
  const { data, error } = await client()
    .from('documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Document[]
}

export async function getDocumentCount(): Promise<number> {
  const { count, error } = await client()
    .from('documents')
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Uploads a file to Supabase Depolama and inserts a metadata row in documents.
 *
 * Path convention (mirrors storage plan):
 *   employee-documents / employees/{employee_id}/{doc_type}/{file_name}
 */
export async function uploadEmployeeDocument(opts: {
  file: File
  employeeId: string
  documentType: Document['document_type']
  uploadedByProfileId: string | null
}): Promise<Document> {
  const { file, employeeId, documentType, uploadedByProfileId } = opts

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `employees/${employeeId}/${documentType}/${Date.now()}_${safeName}`

  // 1. Upload binary to Depolama
  const { error: upErr } = await client()
    .storage
    .from(EMPLOYEE_DOC_BUCKET)
    .upload(storagePath, file, { upsert: false })

  if (upErr) throw new Error(upErr.message)

  // 2. Insert metadata row
  const { data, error: dbErr } = await client()
    .from('documents')
    .insert({
      employee_id: employeeId,
      device_id: null,
      document_type: documentType,
      file_name: file.name,
      storage_bucket: EMPLOYEE_DOC_BUCKET,
      storage_path: storagePath,
      uploaded_by: uploadedByProfileId,
    })
    .select()
    .single()

  if (dbErr) {
    // Rollback: remove the already-uploaded file so storage doesn't orphan.
    await client().storage.from(EMPLOYEE_DOC_BUCKET).remove([storagePath])
    throw new Error(dbErr.message)
  }

  return data as Document
}

export async function deleteDocument(doc: Document): Promise<void> {
  const { data: deletedRows, error: dbErr } = await client()
    .from('documents')
    .delete()
    .eq('id', doc.id)
    .select('id')

  if (dbErr) throw new Error(dbErr.message)

  if (!deletedRows || deletedRows.length === 0) {
    throw new Error('Doküman silinemedi. Bu kayıt için silme yetkiniz olmayabilir.')
  }

  const { error: storageErr } = await client()
    .storage
    .from(doc.storage_bucket)
    .remove([doc.storage_path])

  if (storageErr && !storageErr.message.toLowerCase().includes('not found')) {
    throw new Error(storageErr.message)
  }
}

// İade als a short-lived signed URL for downloading from private buckets.
export async function getSignedUrl(
  storageBucket: string,
  storagePath: string,
  expiresIn = 60,
): Promise<string> {
  const { data, error } = await client()
    .storage
    .from(storageBucket)
    .createSignedUrl(storagePath, expiresIn)
  if (error) throw new Error(error.message)
  return data.signedUrl
}


