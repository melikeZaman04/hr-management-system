import { supabase } from '../../lib/supabaseClient'

export type SalaryRecord = {
  id: string
  employee_id: string
  month: number
  year: number
  annual_base_salary: number
  unpaid_days: number
  monthly_base: number
  deduction: number
  total: number
  notes: string | null
  calculated_by: string | null
  created_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getSalaryRecords(employeeId?: string) {
  let q = client()
    .from('salary_calculations')
    .select('*')
    .order('created_at', { ascending: false })

  if (employeeId) {
    q = q.eq('employee_id', employeeId)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as SalaryRecord[]
}

export async function saveSalaryRecord(record: Omit<SalaryRecord, 'id' | 'created_at'>) {
  const { data, error } = await client()
    .from('salary_calculations')
    .insert(record)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SalaryRecord
}

export function calcSalary(annualBase: number, unpaidDays: number) {
  const monthlyBase = Math.round(annualBase / 12)
  const daily = Math.round(monthlyBase / 22)
  const deduction = daily * unpaidDays
  const total = monthlyBase - deduction
  return { monthlyBase, daily, deduction, total }
}
