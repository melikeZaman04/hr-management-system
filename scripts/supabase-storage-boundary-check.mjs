import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function readLocalEnv(path = '.env.local') {
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

function formatError(error) {
  return JSON.stringify({
    message: error?.message,
    code: error?.code,
    status: error?.status,
  })
}

async function login(env, roleName) {
  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  const roleKeys = keys(roleName)
  const { data, error } = await client.auth.signInWithPassword({
    email: env[roleKeys.email],
    password: env[roleKeys.password],
  })

  if (error) throw new Error(`${roleName} login failed: ${error.message}`)
  return { client, user: data.user }
}

async function listPath(client, bucket, path) {
  const { data, error } = await client.storage.from(bucket).list(path, { limit: 10 })
  if (error) return `ERR ${formatError(error)}`
  return `OK items=${data?.length ?? 0} names=${(data ?? []).map((item) => item.name).join('|')}`
}

async function signedUrl(client, bucket, path) {
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60)
  if (error) return `ERR ${formatError(error)}`

  const response = await fetch(data.signedUrl)
  return `OK download_status=${response.status}`
}

const env = readLocalEnv()
const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
const admin = await login(env, 'admin_hr')
const bucket = 'employee-documents'

console.log(`supabase_host=${new URL(env.VITE_SUPABASE_URL).host}`)

const { data: docs, error: docsError } = await admin.client
  .from('documents')
  .select('id, employee_id, storage_bucket, storage_path')
  .eq('storage_bucket', bucket)
  .limit(1)

if (docsError) throw new Error(`admin documents lookup failed: ${docsError.message}`)

const doc = docs?.[0]

console.log(`admin_document_sample=${doc ? `id=${doc.id} employee_id=${doc.employee_id}` : 'none'}`)
console.log(`anon_list_root=${await listPath(anon, bucket, '')}`)
console.log(`anon_list_employees=${await listPath(anon, bucket, 'employees')}`)

if (doc) {
  const employeeFolder = `employees/${doc.employee_id}`
  const documentFolder = doc.storage_path.split('/').slice(0, -1).join('/')

  console.log(`admin_signed_url_sample=${await signedUrl(admin.client, bucket, doc.storage_path)}`)
  console.log(`anon_list_employee_folder=${await listPath(anon, bucket, employeeFolder)}`)
  console.log(`anon_list_document_folder=${await listPath(anon, bucket, documentFolder)}`)
  console.log(`anon_signed_url_sample=${await signedUrl(anon, bucket, doc.storage_path)}`)
}

await admin.client.auth.signOut()
