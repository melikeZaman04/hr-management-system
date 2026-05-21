import { supabase } from '../../lib/supabaseClient'

export type EmployeeListItem = {
  id: string
  full_name: string
  email: string
  department: string | null
  position: string | null
  employment_status: string
  base_salary: number
}

export type EmployeeDetail = EmployeeListItem & {
  phone: string | null
  start_date: string | null
  created_at: string
  updated_at: string
}

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured yet. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }

  return supabase
}

export async function getEmployees() {
  const client = ensureSupabaseClient()

  const { data, error } = await client
    .from('employees')
    .select('id, full_name, email, department, position, employment_status, base_salary')
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as EmployeeListItem[]
}

export async function getEmployeeById(id: string) {
  const client = ensureSupabaseClient()

  const { data, error } = await client
    .from('employees')
    .select(
      'id, full_name, email, phone, department, position, start_date, employment_status, base_salary, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as EmployeeDetail | null
}
