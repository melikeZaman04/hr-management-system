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
  throw new Error('Usage: node scripts/supabase-document-delete-admin.mjs <document_id>')
}

const env = readLocalEnv()
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { error: loginError } = await supabase.auth.signInWithPassword({
  email: env.LIVE_ADMIN_HR_EMAIL,
  password: env.LIVE_ADMIN_HR_PASSWORD,
})

if (loginError) throw new Error(`Admin login failed: ${loginError.message}`)

const { data: doc, error: lookupError } = await supabase
  .from('documents')
  .select('id, storage_bucket, storage_path, file_name')
  .eq('id', documentId)
  .maybeSingle()

if (lookupError) throw new Error(`Document lookup failed: ${lookupError.message}`)
if (!doc) {
  console.log('document=missing')
  await supabase.auth.signOut()
  process.exit(0)
}

console.log(`document=found id=${doc.id} file_name=${doc.file_name}`)

const { data: deleted, error: deleteError } = await supabase
  .from('documents')
  .delete()
  .eq('id', doc.id)
  .select('id')

if (deleteError) {
  console.log(`document_delete=ERR ${formatError(deleteError)}`)
} else {
  console.log(`document_delete=${deleted?.length ? 'OK' : 'ERR no_rows_deleted'}`)
}

const { error: storageError } = await supabase.storage
  .from(doc.storage_bucket)
  .remove([doc.storage_path])

console.log(storageError ? `storage_remove=ERR ${formatError(storageError)}` : 'storage_remove=OK')

await supabase.auth.signOut()
