import { supabase } from '../../lib/supabaseClient'

export type EmployeeListItem = {
  id: string
  full_name: string
  email: string
  department: string | null
  position: string | null
  employment_status: string
  base_salary: number
  profile_id: string | null
  manager_id: string | null
}

export type EmployeeDetail = EmployeeListItem & {
  phone: string | null
  start_date: string | null
  profile_id: string | null
  created_at: string
  updated_at: string
}

export type EmploymentStatus = 'active' | 'inactive' | 'terminated'

export type CreateEmployeeInput = {
  full_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  start_date?: string
  manager_id?: string | null
  employment_status: EmploymentStatus
  base_salary: number
}

export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, 'email'>>

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
    .select('id, full_name, email, department, position, employment_status, base_salary, profile_id, manager_id')
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as EmployeeListItem[]
}

export async function getEmployeeForAuth(opts: {
  profileId?: string | null
  email?: string | null
}): Promise<EmployeeListItem | null> {
  const client = ensureSupabaseClient()
  const { profileId, email } = opts

  if (profileId) {
    const { data, error } = await client
      .from('employees')
      .select('id, full_name, email, department, position, employment_status, base_salary, profile_id, manager_id')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return data as EmployeeListItem
  }

  if (email) {
    const { data, error } = await client
      .from('employees')
      .select('id, full_name, email, department, position, employment_status, base_salary, profile_id, manager_id')
      .ilike('email', email)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return data as EmployeeListItem
  }

  return null
}

export async function getEmployeeById(id: string) {
  const client = ensureSupabaseClient()

  const { data, error } = await client
    .from('employees')
    .select(
      'id, full_name, email, phone, department, position, start_date, employment_status, base_salary, profile_id, manager_id, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as EmployeeDetail | null
}

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDetail> {
  const client = ensureSupabaseClient()

  const { data, error } = await client
    .from('employees')
    .insert({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      department: input.department || null,
      position: input.position || null,
      start_date: input.start_date || null,
      manager_id: input.manager_id || null,
      employment_status: input.employment_status,
      base_salary: input.base_salary,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as EmployeeDetail
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeDetail> {
  const client = ensureSupabaseClient()
  const payload = {
    ...input,
    phone: input.phone || null,
    department: input.department || null,
    position: input.position || null,
    start_date: input.start_date || null,
  }

  if (Object.prototype.hasOwnProperty.call(input, 'manager_id')) {
    payload.manager_id = input.manager_id || null
  }

  const { data, error } = await client
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as EmployeeDetail
}

export async function setEmployeeStatus(
  id: string,
  status: EmploymentStatus,
): Promise<void> {
  const client = ensureSupabaseClient()

  const { error } = await client
    .from('employees')
    .update({ employment_status: status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getActiveEmployeeCount(): Promise<number> {
  const client = ensureSupabaseClient()
  const { count, error } = await client
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('employment_status', 'active')
  if (error) throw new Error(error.message)
  return count ?? 0
}
