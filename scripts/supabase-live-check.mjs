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

const env = readLocalEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required')
}

const supabase = createClient(url, anonKey)
const tables = [
  'profiles',
  'employees',
  'leave_requests',
  'salary_records',
  'devices',
  'device_assignments',
  'documents',
]
const buckets = ['employee-documents', 'device-invoices']

console.log(`supabase_host=${new URL(url).host}`)
console.log('anon_table_checks')

function formatError(error) {
  return JSON.stringify({
    name: error?.name,
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  })
}

for (const table of tables) {
  const { count, data, error, status, statusText } = await supabase
    .from(table)
    .select('id', { count: 'exact' })
    .limit(1)

  if (error) {
    console.log(`${table}=ERR status=${status} status_text=${statusText} error=${formatError(error)}`)
  } else {
    console.log(`${table}=OK status=${status} count=${count ?? 0} sample_rows=${data?.length ?? 0}`)
  }
}

console.log('anon_storage_checks')

for (const bucket of buckets) {
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 })

  if (error) {
    console.log(`${bucket}=ERR error=${formatError(error)}`)
  } else {
    console.log(`${bucket}=OK listable_items=${data?.length ?? 0}`)
  }
}
