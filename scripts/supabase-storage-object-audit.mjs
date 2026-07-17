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

function fmtError(error) {
  return JSON.stringify({
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  })
}

async function list(client, bucket, path) {
  const { data, error } = await client.storage.from(bucket).list(path, { limit: 100 })
  if (error) {
    console.log(`list path="${path}" ERR ${fmtError(error)}`)
    return []
  }

  console.log(`list path="${path}" OK count=${data?.length ?? 0}`)
  for (const item of data ?? []) {
    console.log(`  item name="${item.name}" id=${item.id ?? 'folder'} size=${item.metadata?.size ?? 'n/a'} updated_at=${item.updated_at ?? 'n/a'}`)
  }
  return data ?? []
}

const documentId = process.argv[2]
if (!documentId) {
  throw new Error('Usage: node scripts/supabase-storage-object-audit.mjs <document_id>')
}

const env = readLocalEnv()
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { error: loginError } = await client.auth.signInWithPassword({
  email: env.LIVE_ADMIN_HR_EMAIL,
  password: env.LIVE_ADMIN_HR_PASSWORD,
})

if (loginError) throw new Error(`Admin login failed: ${loginError.message}`)

const { data: doc, error: docError } = await client
  .from('documents')
  .select('id, employee_id, file_name, storage_bucket, storage_path, created_at')
  .eq('id', documentId)
  .maybeSingle()

if (docError) throw new Error(`Document lookup failed: ${docError.message}`)
if (!doc) throw new Error('Document not found')

const parts = doc.storage_path.split('/')
const fileName = parts.at(-1)
const docTypeFolder = parts.slice(0, -1).join('/')
const employeeFolder = parts.slice(0, 2).join('/')
const rootFolder = parts[0]

console.log(`document_id=${doc.id}`)
console.log(`document_file_name=${doc.file_name}`)
console.log(`document_created_at=${doc.created_at}`)
console.log(`bucket=${doc.storage_bucket}`)
console.log(`storage_path=${doc.storage_path}`)
console.log(`expected_object_name=${fileName}`)

console.log('storage_api_listing')
await list(client, doc.storage_bucket, '')
await list(client, doc.storage_bucket, rootFolder)
await list(client, doc.storage_bucket, employeeFolder)
await list(client, doc.storage_bucket, docTypeFolder)

console.log('storage_objects_table_exact')
const { data: exactObjects, error: exactError } = await client
  .schema('storage')
  .from('objects')
  .select('id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata')
  .eq('bucket_id', doc.storage_bucket)
  .eq('name', doc.storage_path)

if (exactError) {
  console.log(`exact=ERR ${fmtError(exactError)}`)
} else {
  console.log(`exact=OK count=${exactObjects?.length ?? 0}`)
  for (const object of exactObjects ?? []) {
    console.log(`  object name="${object.name}" size=${object.metadata?.size ?? 'n/a'} updated_at=${object.updated_at}`)
  }
}

console.log('storage_objects_table_prefix')
const { data: prefixObjects, error: prefixError } = await client
  .schema('storage')
  .from('objects')
  .select('id, bucket_id, name, owner, created_at, updated_at, metadata')
  .eq('bucket_id', doc.storage_bucket)
  .like('name', `${docTypeFolder}/%`)
  .order('created_at', { ascending: false })
  .limit(20)

if (prefixError) {
  console.log(`prefix=ERR ${fmtError(prefixError)}`)
} else {
  console.log(`prefix=OK count=${prefixObjects?.length ?? 0}`)
  for (const object of prefixObjects ?? []) {
    console.log(`  object name="${object.name}" size=${object.metadata?.size ?? 'n/a'} created_at=${object.created_at}`)
  }
}

await client.auth.signOut()
