import { supabase } from '../../lib/supabaseClient'

export type UserRole = 'admin_hr' | 'manager' | 'employee'

// Mirrors public.profiles schema.
export type Profile = {
  id: string           // same as auth.users.id
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await client().auth.getUser()
  if (!user) return null

  const { data, error } = await client()
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Profile | null
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await client()
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Profile | null
}

export async function updateProfileRole(id: string, role: UserRole): Promise<Profile> {
  const { data, error } = await client()
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Profile
}

export async function getProfilesByRole(role: UserRole): Promise<Profile[]> {
  const { data, error } = await client()
    .from('profiles')
    .select('*')
    .eq('role', role)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Profile[]
}
