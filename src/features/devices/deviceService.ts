import { supabase } from '../../lib/supabaseClient'

export type Device = {
  id: string
  name: string
  device_type: string
  serial_number: string
  status: 'available' | 'assigned' | 'returned' | 'broken'
  assignee_id: string | null
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getDevices(filters?: { status?: string; query?: string }) {
  const { data, error } = await client()
    .from('devices')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  let devices = (data ?? []) as Device[]

  if (filters?.status && filters.status !== 'all') {
    devices = devices.filter(d => d.status === filters.status)
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase()
    devices = devices.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.serial_number.toLowerCase().includes(q) ||
      d.device_type.toLowerCase().includes(q)
    )
  }
  return devices
}

export async function getDevicesForEmployee(employeeId: string) {
  const { data, error } = await client()
    .from('devices')
    .select('*')
    .eq('assignee_id', employeeId)
  if (error) throw new Error(error.message)
  return (data ?? []) as Device[]
}
