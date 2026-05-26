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
  created_at: string
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

export async function approveLeaveRequest(id: string) {
  const { error } = await client()
    .from('leave_requests')
    .update({ status: 'approved' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function rejectLeaveRequest(id: string) {
  const { error } = await client()
    .from('leave_requests')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
