import { supabase } from '../../lib/supabaseClient'

// Mirrors public.devices. Assignment ownership lives in device_assignments.
export type Device = {
  id: string
  name: string
  device_type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  location: string | null
  status: 'available' | 'assigned' | 'returned' | 'broken'
  notes: string | null
  created_at: string
  updated_at: string
}

// Active assignment joined from device_assignments.
export type DeviceWithAssignee = Device & {
  assignee_id: string | null
  assignment_id: string | null
  assigned_at: string | null
}

export type CreateDeviceInput = {
  name: string
  device_type: string
  brand?: string
  model?: string
  serial_number?: string
  location?: string
  notes?: string
}

type DeviceAssignment = {
  id: string
  device_id: string
  employee_id: string
  assigned_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

function withAssignment(device: Device, assignment?: DeviceAssignment): DeviceWithAssignee {
  return {
    ...device,
    assignee_id: assignment?.employee_id ?? null,
    assignment_id: assignment?.id ?? null,
    assigned_at: assignment?.assigned_at ?? null,
  }
}

export async function getDevices(): Promise<DeviceWithAssignee[]> {
  const { data: devices, error: dErr } = await client()
    .from('devices')
    .select('*')
    .order('name')

  if (dErr) throw new Error(dErr.message)
  if (!devices || devices.length === 0) return []

  const deviceIds = devices.map((d) => d.id as string)
  const { data: assignments, error: aErr } = await client()
    .from('device_assignments')
    .select('id, device_id, employee_id, assigned_at')
    .in('device_id', deviceIds)
    .eq('status', 'active')

  if (aErr) throw new Error(aErr.message)

  const assignmentByDevice = new Map(
    ((assignments ?? []) as DeviceAssignment[]).map((a) => [a.device_id, a]),
  )

  return ((devices ?? []) as Device[]).map((d) => withAssignment(d, assignmentByDevice.get(d.id)))
}

export async function getDevicesForEmployee(employeeId: string): Promise<DeviceWithAssignee[]> {
  const { data: assignments, error: aErr } = await client()
    .from('device_assignments')
    .select('id, device_id, employee_id, assigned_at')
    .eq('employee_id', employeeId)
    .eq('status', 'active')

  if (aErr) throw new Error(aErr.message)
  if (!assignments || assignments.length === 0) return []

  const deviceIds = assignments.map(a => a.device_id as string)

  const { data: devices, error: dErr } = await client()
    .from('devices')
    .select('*')
    .in('id', deviceIds)

  if (dErr) throw new Error(dErr.message)

  return ((devices ?? []) as Device[]).map((d) => {
    const a = assignments.find((assignment) => assignment.device_id === d.id)
    return withAssignment(d, a as DeviceAssignment | undefined)
  })
}

export async function createDevice(input: CreateDeviceInput): Promise<Device> {
  const { data, error } = await client()
    .from('devices')
    .insert({
      name: input.name.trim(),
      device_type: input.device_type,
      brand: input.brand?.trim() || null,
      model: input.model?.trim() || null,
      serial_number: input.serial_number?.trim() || null,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      status: 'available',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Device
}

// Assigns an available device to an employee:
// 1. Inserts device_assignments row (status=active)
// 2. Updates devices.status to 'assigned'
export async function assignDevice(
  deviceId: string,
  employeeId: string,
  assignedByProfileId?: string,
): Promise<void> {
  const { error: aErr } = await client()
    .from('device_assignments')
    .insert({
      device_id: deviceId,
      employee_id: employeeId,
      status: 'active',
      assigned_at: new Date().toISOString().split('T')[0],
      assigned_by: assignedByProfileId ?? null,
    })
  if (aErr) throw new Error(aErr.message)

  const { error: dErr } = await client()
    .from('devices')
    .update({ status: 'assigned' })
    .eq('id', deviceId)
  if (dErr) throw new Error(dErr.message)
}

// Returns a device:
// 1. Marks the active device_assignments row as returned
// 2. Updates devices.status to 'available'
export async function returnDevice(
  deviceId: string,
  assignmentId: string,
): Promise<void> {
  const { error: aErr } = await client()
    .from('device_assignments')
    .update({
      status: 'returned',
      returned_at: new Date().toISOString().split('T')[0],
    })
    .eq('id', assignmentId)
  if (aErr) throw new Error(aErr.message)

  const { error: dErr } = await client()
    .from('devices')
    .update({ status: 'available' })
    .eq('id', deviceId)
  if (dErr) throw new Error(dErr.message)
}

export async function updateDeviceStatus(
  deviceId: string,
  status: Device['status'],
  notes?: string | null,
): Promise<void> {
  const payload: Pick<Device, 'status'> & { notes?: string | null } = { status }

  if (notes !== undefined) {
    payload.notes = notes?.trim() || null
  }

  const { error } = await client()
    .from('devices')
    .update(payload)
    .eq('id', deviceId)

  if (error) throw new Error(error.message)
}

export async function getDeviceCount(): Promise<number> {
  const { count, error } = await client()
    .from('devices')
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getAssignedDeviceCount(): Promise<number> {
  const { count, error } = await client()
    .from('devices')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'assigned')
  if (error) throw new Error(error.message)
  return count ?? 0
}
