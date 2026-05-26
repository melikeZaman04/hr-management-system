import { supabase } from '../../lib/supabaseClient'

export type Document = {
  id: string
  employee_id: string
  document_type: string
  file_name: string
  file_path: string
  size: string | null
  uploaded_by: string | null
  created_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getDocuments(filters?: { employee_id?: string; document_type?: string }) {
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
