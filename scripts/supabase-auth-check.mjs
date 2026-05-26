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

function formatError(error) {
  return JSON.stringify({
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  })
}

function credentialKeys(roleName) {
  const normalized = roleName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  return {
    email: `LIVE_${normalized}_EMAIL`,
    password: `LIVE_${normalized}_PASSWORD`,
  }
}

async function checkTable(supabase, table, select = 'id') {
  const { count, data, error, status } = await supabase
    .from(table)
    .select(select, { count: 'exact' })
    .limit(3)

  if (error) {
    console.log(`${table}=ERR status=${status} error=${formatError(error)}`)
    return
  }

  console.log(`${table}=OK status=${status} count=${count ?? 0} sample_rows=${data?.length ?? 0}`)
}

const roleName = process.argv[2]

if (!roleName) {
  throw new Error('Usage: node scripts/supabase-auth-check.mjs <admin_hr|manager|employee>')
}

const env = readLocalEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
const keys = credentialKeys(roleName)
const email = env[keys.email]
const password = env[keys.password]

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required')
}

if (!email || !password) {
  throw new Error(`Missing ${keys.email} or ${keys.password} in .env.local`)
}

const supabase = createClient(url, anonKey)

console.log(`supabase_host=${new URL(url).host}`)
console.log(`login_role_label=${roleName}`)
console.log(`login_email=${email}`)

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (signInError) {
  throw new Error(`Login failed: ${signInError.message}`)
}

const user = signInData.user
console.log(`auth_user_id=${user.id}`)
console.log(`auth_user_email=${user.email}`)

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, full_name, role, is_active, created_at, updated_at')
  .eq('id', user.id)
  .maybeSingle()

if (profileError) {
  console.log(`profile=ERR ${formatError(profileError)}`)
} else if (!profile) {
  console.log('profile=MISSING')
} else {
  console.log(`profile=OK id=${profile.id} role=${profile.role} is_active=${profile.is_active} full_name=${profile.full_name}`)
}

let matchedEmployee = null

if (profile?.id) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, department, position, employment_status, profile_id, manager_id')
    .eq('profile_id', profile.id)
    .maybeSingle()

  if (error) {
    console.log(`employee_by_profile=ERR ${formatError(error)}`)
  } else if (data) {
    matchedEmployee = data
    console.log(`employee_by_profile=OK id=${data.id} email=${data.email} status=${data.employment_status}`)
  } else {
    console.log('employee_by_profile=MISSING')
  }
}

if (!matchedEmployee && user.email) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, department, position, employment_status, profile_id, manager_id')
    .ilike('email', user.email)
    .maybeSingle()

  if (error) {
    console.log(`employee_by_email=ERR ${formatError(error)}`)
  } else if (data) {
    matchedEmployee = data
    console.log(`employee_by_email=OK id=${data.id} email=${data.email} status=${data.employment_status} profile_id=${data.profile_id}`)
  } else {
    console.log('employee_by_email=MISSING')
  }
}

console.log('authenticated_table_checks')
await checkTable(supabase, 'profiles', 'id, role, is_active')
await checkTable(supabase, 'employees', 'id, email, profile_id, manager_id, employment_status')
await checkTable(supabase, 'leave_requests', 'id, employee_id, status, reviewed_by')
await checkTable(supabase, 'salary_records', 'id, employee_id, month, year, calculated_by')
await checkTable(supabase, 'devices', 'id, name, status')
await checkTable(supabase, 'device_assignments', 'id, device_id, employee_id, status')
await checkTable(supabase, 'documents', 'id, employee_id, document_type, storage_bucket')

console.log('authenticated_storage_checks')
for (const bucket of ['employee-documents', 'device-invoices']) {
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 3 })
  if (error) {
    console.log(`${bucket}=ERR ${formatError(error)}`)
  } else {
    console.log(`${bucket}=OK listable_items=${data?.length ?? 0}`)
  }
}

await supabase.auth.signOut()
