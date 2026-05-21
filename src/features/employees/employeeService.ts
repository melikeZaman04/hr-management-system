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

export async function getEmployees() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured yet. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }

  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, department, position, employment_status, base_salary')
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as EmployeeListItem[]
}
