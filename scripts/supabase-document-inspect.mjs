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

function formatError(error) {
  return JSON.stringify({
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  })
}

const documentId = process.argv[2]
if (!documentId) {
  throw new Error('Usage: node scripts/supabase-document-inspect.mjs <document_id>')
}

const env = readLocalEnv()
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
  email: env.LIVE_ADMIN_HR_EMAIL,
  password: env.LIVE_ADMIN_HR_PASSWORD,
})

if (loginError) {
  throw new Error(`Admin login failed: ${loginError.message}`)
}

console.log(`supabase_host=${new URL(env.VITE_SUPABASE_URL).host}`)
console.log(`admin_user_id=${login.user.id}`)

const { data: doc, error: docError } = await supabase
  .from('documents')
  .select('*')
  .eq('id', documentId)
  .maybeSingle()

if (docError) {
  throw new Error(`Document lookup failed: ${docError.message}`)
}

if (!doc) {
  console.log('document=MISSING')
  await supabase.auth.signOut()
  process.exit(0)
}

console.log('document=OK')
console.log(`id=${doc.id}`)
console.log(`file_name=${doc.file_name}`)
console.log(`document_type=${doc.document_type}`)
console.log(`employee_id=${doc.employee_id}`)
console.log(`device_id=${doc.device_id}`)
console.log(`storage_bucket=${doc.storage_bucket}`)
console.log(`storage_path=${doc.storage_path}`)
console.log(`uploaded_by=${doc.uploaded_by}`)
console.log(`created_at=${doc.created_at}`)
console.log(`updated_at=${doc.updated_at}`)

if (doc.employee_id) {
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, full_name, email, department, position, profile_id')
    .eq('id', doc.employee_id)
    .maybeSingle()

  if (employeeError) {
    console.log(`employee=ERR ${formatError(employeeError)}`)
  } else if (employee) {
    console.log(`employee=OK full_name=${employee.full_name} email=${employee.email} department=${employee.department} position=${employee.position}`)
  } else {
    console.log('employee=MISSING')
  }
}

if (doc.uploaded_by) {
  const { data: uploader, error: uploaderError } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', doc.uploaded_by)
    .maybeSingle()

  if (uploaderError) {
    console.log(`uploader=ERR ${formatError(uploaderError)}`)
  } else if (uploader) {
    console.log(`uploader=OK full_name=${uploader.full_name} role=${uploader.role} is_active=${uploader.is_active}`)
  } else {
    console.log('uploader=MISSING')
  }
}

const { data: signed, error: signedError } = await supabase.storage
  .from(doc.storage_bucket)
  .createSignedUrl(doc.storage_path, 60)

if (signedError) {
  console.log(`storage_object=ERR ${formatError(signedError)}`)
} else {
  const response = await fetch(signed.signedUrl)
  console.log(`storage_object=OK download_status=${response.status} content_type=${response.headers.get('content-type')} bytes=${response.headers.get('content-length')}`)
}

await supabase.auth.signOut()
