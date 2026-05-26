import { supabase } from '../../lib/supabaseClient'

export type LeaveRequest = {
  id: string
  employee_id: string
  leave_type: 'annual' | 'unpaid' | 'sick' | 'other'
  start_date: string
  end_date: string
  total_days: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type CreateLeaveRequestInput = {
  employee_id: string
  leave_type: LeaveRequest['leave_type']
  start_date: string  // YYYY-MM-DD
  end_date: string    // YYYY-MM-DD
  total_days: number
  reason?: string
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getLeaveRequests(filters?: { status?: string; leave_type?: string }) {
  let q = client()
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  if (filters?.leave_type && filters.leave_type !== 'all') {
    q = q.eq('leave_type', filters.leave_type)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as LeaveRequest[]
}

export async function getLeaveRequestsForEmployee(employeeId: string) {
  const { data, error } = await client()
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as LeaveRequest[]
}

export async function createLeaveRequest(
  input: CreateLeaveRequestInput,
): Promise<LeaveRequest> {
  const { data, error } = await client()
    .from('leave_requests')
    .insert({
      employee_id: input.employee_id,
      leave_type: input.leave_type,
      start_date: input.start_date,
      end_date: input.end_date,
      total_days: input.total_days,
      reason: input.reason || null,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as LeaveRequest
}

export async function approveLeaveRequest(id: string) {
  const { data: { user } } = await client().auth.getUser()
  const { error } = await client()
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function rejectLeaveRequest(id: string) {
  const { data: { user } } = await client().auth.getUser()
  const { error } = await client()
    .from('leave_requests')
    .update({
      status: 'rejected',
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getPendingLeaveCount(): Promise<number> {
  const { count, error } = await client()
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
  return count ?? 0
}
