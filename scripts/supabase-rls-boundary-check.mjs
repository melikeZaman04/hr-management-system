import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function readLocalEnv(path = '.env.local') {
  if (!fs.existsSync(path)) {
    throw new Error(`${path} not found`)
  }

  return Object.fromEntries(
    fs
      .readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

function keys(roleName) {
  const normalized = roleName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  return {
    email: `LIVE_${normalized}_EMAIL`,
    password: `LIVE_${normalized}_PASSWORD`,
  }
}

async function login(env, roleName) {
  const credentialKeys = keys(roleName)
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  const email = env[credentialKeys.email]
  const password = env[credentialKeys.password]

  if (!email || !password) {
    throw new Error(`Missing ${credentialKeys.email} or ${credentialKeys.password}`)
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${roleName} login failed: ${error.message}`)

  return { supabase, user: data.user, email }
}

async function getProfileAndEmployee(client, user) {
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw new Error(`profile lookup failed: ${profileError.message}`)

  const { data: employee, error: employeeError } = await client
    .from('employees')
    .select('id, full_name, email, profile_id, manager_id, employment_status')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (employeeError) throw new Error(`employee lookup failed: ${employeeError.message}`)
  return { profile, employee }
}

async function canReadEmployee(client, employeeId) {
  const { data, error, status } = await client
    .from('employees')
    .select('id, full_name, email, manager_id')
    .eq('id', employeeId)
    .maybeSingle()

  return {
    ok: Boolean(data && !error),
    status,
    error: error?.message ?? null,
    row: data,
  }
}

async function countRows(client, table) {
  const { count, error, status } = await client
    .from(table)
    .select('id', { count: 'exact', head: true })

  return error ? `ERR status=${status} ${error.message}` : `OK count=${count ?? 0}`
}

const env = readLocalEnv()
const admin = await login(env, 'admin_hr')
const manager = await login(env, 'manager')
const employee = await login(env, 'employee')

console.log(`supabase_host=${new URL(env.VITE_SUPABASE_URL).host}`)

const { employee: managerEmployee } = await getProfileAndEmployee(manager.supabase, manager.user)
const { employee: currentEmployee } = await getProfileAndEmployee(employee.supabase, employee.user)

console.log(`manager_employee=${managerEmployee?.id ?? 'missing'} email=${managerEmployee?.email ?? 'missing'}`)
console.log(`employee_self=${currentEmployee?.id ?? 'missing'} email=${currentEmployee?.email ?? 'missing'}`)

const { data: allEmployees, error: allEmployeesError } = await admin.supabase
  .from('employees')
  .select('id, full_name, email, manager_id, profile_id')
  .order('full_name')

if (allEmployeesError) {
  throw new Error(`admin employee inventory failed: ${allEmployeesError.message}`)
}

const teamEmployee = allEmployees.find((row) => row.manager_id === managerEmployee?.id)
const nonTeamEmployee = allEmployees.find(
  (row) => row.id !== managerEmployee?.id && row.manager_id !== managerEmployee?.id,
)
const otherEmployee = allEmployees.find((row) => row.id !== currentEmployee?.id)

console.log(`admin_inventory_employees=${allEmployees.length}`)
console.log(`manager_team_target=${teamEmployee?.id ?? 'none'} email=${teamEmployee?.email ?? 'none'}`)
console.log(`manager_non_team_target=${nonTeamEmployee?.id ?? 'none'} email=${nonTeamEmployee?.email ?? 'none'}`)
console.log(`employee_other_target=${otherEmployee?.id ?? 'none'} email=${otherEmployee?.email ?? 'none'}`)

if (currentEmployee) {
  const selfRead = await canReadEmployee(employee.supabase, currentEmployee.id)
  console.log(`employee_read_self=${selfRead.ok ? 'ALLOW' : 'DENY'} status=${selfRead.status}`)
}

if (otherEmployee) {
  const otherRead = await canReadEmployee(employee.supabase, otherEmployee.id)
  console.log(`employee_read_other=${otherRead.ok ? 'ALLOW' : 'DENY'} status=${otherRead.status} target=${otherEmployee.email}`)
}

if (teamEmployee) {
  const teamRead = await canReadEmployee(manager.supabase, teamEmployee.id)
  console.log(`manager_read_team_member=${teamRead.ok ? 'ALLOW' : 'DENY'} status=${teamRead.status} target=${teamEmployee.email}`)
}

if (nonTeamEmployee) {
  const nonTeamRead = await canReadEmployee(manager.supabase, nonTeamEmployee.id)
  console.log(`manager_read_non_team_member=${nonTeamRead.ok ? 'ALLOW' : 'DENY'} status=${nonTeamRead.status} target=${nonTeamEmployee.email}`)
}

console.log('role_row_counts')
for (const table of ['profiles', 'employees', 'leave_requests', 'salary_records', 'devices', 'device_assignments', 'documents']) {
  console.log(`employee_${table}=${await countRows(employee.supabase, table)}`)
}
for (const table of ['profiles', 'employees', 'leave_requests', 'salary_records', 'devices', 'device_assignments', 'documents']) {
  console.log(`manager_${table}=${await countRows(manager.supabase, table)}`)
}

await admin.supabase.auth.signOut()
await manager.supabase.auth.signOut()
await employee.supabase.auth.signOut()
