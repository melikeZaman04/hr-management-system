import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient'
import { AuthContext, type AuthContextValue } from './authContext'
import { getCurrentProfile, type Profile } from './profileService'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileStatus, setProfileStatus] = useState<AuthContextValue['profileStatus']>(supabase ? 'loading' : 'missing')
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function loadProfile() {
    try {
      setProfileStatus('loading')
      setProfileErrorMessage(null)
      const p = await getCurrentProfile()
      setProfile(p)
      setProfileStatus(p ? 'loaded' : 'missing')
    } catch (err) {
      // Keep previous profile (if any) to avoid role flicker.
      setProfileStatus('error')
      setProfileErrorMessage(err instanceof Error ? err.message : 'Profil bilgisi yüklenemedi.')
    }
  }

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    const client = supabase
    let isMounted = true

    async function loadSession() {
      const { data, error } = await client.auth.getSession()

      if (!isMounted) return

      if (error) {
        setErrorMessage(error.message)
      } else {
        setSession(data.session)
        if (data.session) {
          await loadProfile()
        } else {
          setProfile(null)
          setProfileStatus('missing')
          setProfileErrorMessage(null)
        }
      }

      setIsLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      setErrorMessage(null)
      setIsLoading(false)

      if (nextSession) {
        void loadProfile()
      } else {
        setProfile(null)
        setProfileStatus('missing')
        setProfileErrorMessage(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      errorMessage,
      isAuthenticated: Boolean(session),
      isLoading,
      session,
      profile,
      profileStatus,
      profileErrorMessage,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [errorMessage, isLoading, session, profile, profileStatus, profileErrorMessage],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
