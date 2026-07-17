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
  overtime_hours?: number | null
  overtime_hourly_rate?: number | null
  overtime_amount?: number | null
  calculated_salary: number
  calculated_by: string | null  // profiles.id UUID
  created_at: string
  updated_at: string
}

export type SalaryCalculation = {
  monthlyBase: number
  daily: number
  hourly: number
  overtimeAmount: number
  deduction: number
  total: number
}

type LeaveDateRange = {
  start_date: string
  end_date: string
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
  const payload: Record<string, unknown> = {
    employee_id: record.employee_id,
    month: record.month,
    year: record.year,
    base_salary: record.base_salary,
    unpaid_leave_days: record.unpaid_leave_days,
    deduction_amount: record.deduction_amount,
    calculated_salary: record.calculated_salary,
    calculated_by: record.calculated_by,
  }

  if (record.overtime_hours || record.overtime_hourly_rate || record.overtime_amount) {
    payload.overtime_hours = record.overtime_hours ?? 0
    payload.overtime_hourly_rate = record.overtime_hourly_rate ?? 0
    payload.overtime_amount = record.overtime_amount ?? 0
  }

  const { data, error } = await client()
    .from('salary_records')
    .insert(payload)
    .select()
    .single()

  if (error) {
    const msg = error.message.toLowerCase()
    const missingOptionalColumn = msg.includes('overtime_') || msg.includes('schema cache')

    if (!missingOptionalColumn) throw new Error(error.message)

    const { data: fallbackData, error: fallbackError } = await client()
      .from('salary_records')
      .insert({
        employee_id: record.employee_id,
        month: record.month,
        year: record.year,
        base_salary: record.base_salary,
        unpaid_leave_days: record.unpaid_leave_days,
        deduction_amount: record.deduction_amount,
        calculated_salary: record.calculated_salary,
        calculated_by: record.calculated_by,
      })
      .select()
      .single()

    if (fallbackError) throw new Error(fallbackError.message)
    return fallbackData as SalaryRecord
  }

  return data as SalaryRecord
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function daysInclusive(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

function overlappingDays(range: LeaveDateRange, periodStart: Date, periodEnd: Date) {
  const leaveStart = parseDateOnly(range.start_date)
  const leaveEnd = parseDateOnly(range.end_date)
  const start = new Date(Math.max(leaveStart.getTime(), periodStart.getTime()))
  const end = new Date(Math.min(leaveEnd.getTime(), periodEnd.getTime()))
  if (end < start) return 0
  return daysInclusive(start, end)
}

export function getSalaryPeriodBounds(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  return {
    start,
    end,
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
  }
}

export async function getApprovedUnpaidLeaveDaysForPeriod(
  employeeId: string,
  month: number,
  year: number,
): Promise<number> {
  const period = getSalaryPeriodBounds(month, year)
  const { data, error } = await client()
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('employee_id', employeeId)
    .eq('leave_type', 'unpaid')
    .eq('status', 'approved')
    .lte('start_date', period.endDate)
    .gte('end_date', period.startDate)

  if (error) throw new Error(error.message)

  return ((data ?? []) as LeaveDateRange[])
    .reduce((sum, leave) => sum + overlappingDays(leave, period.start, period.end), 0)
}

export function calcSalary(
  baseSalary: number,
  unpaidDays: number,
  overtimeHours = 0,
  overtimeHourlyRate?: number,
): SalaryCalculation {
  const monthlyBase = baseSalary
  const daily = Math.round(baseSalary / 30)
  const hourly = Math.round(daily / 7.5)
  const deduction = daily * unpaidDays
  const effectiveHourly = overtimeHourlyRate ?? hourly
  const overtimeAmount = Math.round(Math.max(0, overtimeHours) * Math.max(0, effectiveHourly))
  const total = Math.max(0, baseSalary - deduction + overtimeAmount)
  return { monthlyBase, daily, hourly, overtimeAmount, deduction, total }
}
