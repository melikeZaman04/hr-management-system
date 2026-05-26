import { supabase } from '../../lib/supabaseClient'

// Mirrors public.salary_records schema exactly.
export type SalaryRecord = {
  id: string
  employee_id: string
  month: number
  year: number
  base_salary: number
  unpaid_leave_days: number
  deduction_amount: number
  calculated_salary: number
  calculated_by: string | null  // profiles.id UUID
  created_at: string
  updated_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getSalaryRecords(employeeId?: string) {
  let q = client()
    .from('salary_records')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (employeeId) {
    q = q.eq('employee_id', employeeId)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as SalaryRecord[]
}

export async function saveSalaryRecord(
  record: Omit<SalaryRecord, 'id' | 'created_at' | 'updated_at'>,
) {
  const { data, error } = await client()
    .from('salary_records')
    .insert(record)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SalaryRecord
}

export function calcSalary(baseSalary: number, unpaidDays: number) {
  const monthlyBase = baseSalary
  const daily = Math.round(baseSalary / 30)
  const deduction = daily * unpaidDays
  const total = baseSalary - deduction
  return { monthlyBase, daily, deduction, total }
}
