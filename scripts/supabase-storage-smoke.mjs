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

function credentialKeys(roleName) {
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
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  })
}

const roleName = process.argv[2] ?? 'employee'
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
const bucket = 'employee-documents'
const documentType = 'employee_document'
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
const fileName = `storage-smoke-${roleName}-${runId}.txt`
let storagePath = null
let documentId = null

console.log(`supabase_host=${new URL(url).host}`)
console.log(`storage_smoke_role=${roleName}`)
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

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, role, full_name, is_active')
  .eq('id', user.id)
  .maybeSingle()

if (profileError) {
  throw new Error(`Profile lookup failed: ${profileError.message}`)
}

if (!profile) {
  throw new Error('Profile missing; storage smoke requires a profile row')
}

console.log(`profile=OK role=${profile.role} is_active=${profile.is_active}`)

const { data: employee, error: employeeError } = await supabase
  .from('employees')
  .select('id, email, full_name, profile_id')
  .eq('profile_id', profile.id)
  .maybeSingle()

if (employeeError) {
  throw new Error(`Employee lookup failed: ${employeeError.message}`)
}

if (!employee) {
  throw new Error('Employee row missing; storage smoke requires employees.profile_id match')
}

console.log(`employee=OK id=${employee.id} email=${employee.email}`)

storagePath = `employees/${employee.id}/${documentType}/${fileName}`
const fileBody = `Supabase storage smoke test\nrole=${roleName}\nuser=${user.id}\nrun=${runId}\n`

try {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, new Blob([fileBody], { type: 'text/plain' }), {
      contentType: 'text/plain',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`storage_upload=ERR ${formatError(uploadError)}`)
  }

  console.log(`storage_upload=OK bucket=${bucket} path=${storagePath}`)

  const { data: document, error: insertError } = await supabase
    .from('documents')
    .insert({
      employee_id: employee.id,
      device_id: null,
      document_type: documentType,
      file_name: fileName,
      storage_bucket: bucket,
      storage_path: storagePath,
      uploaded_by: profile.id,
    })
    .select('id, employee_id, document_type, storage_bucket, storage_path')
    .single()

  if (insertError) {
    throw new Error(`document_insert=ERR ${formatError(insertError)}`)
  }

  documentId = document.id
  console.log(`document_insert=OK id=${documentId}`)

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60)

  if (signedError) {
    throw new Error(`signed_url=ERR ${formatError(signedError)}`)
  }

  console.log('signed_url=OK')

  const response = await fetch(signed.signedUrl)
  const text = await response.text()

  if (!response.ok || text !== fileBody) {
    throw new Error(`signed_download=ERR status=${response.status} body_length=${text.length}`)
  }

  console.log(`signed_download=OK status=${response.status} bytes=${text.length}`)
} finally {
  if (documentId) {
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .select('id')
    console.log(
      error
        ? `cleanup_document=ERR ${formatError(error)}`
        : `cleanup_document=${data?.length ? 'OK' : 'ERR no_rows_deleted'}`,
    )
  }

  if (storagePath) {
    const { error } = await supabase.storage.from(bucket).remove([storagePath])
    console.log(error ? `cleanup_storage=ERR ${formatError(error)}` : 'cleanup_storage=OK')
  }

  await supabase.auth.signOut()
}
