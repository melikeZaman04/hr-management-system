import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    const client = supabase
    let isMounted = true

    async function loadSession() {
      const { data, error } = await client.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setErrorMessage(error.message)
      } else {
        setSession(data.session)
      }

      setIsLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setErrorMessage(null)
      setIsLoading(false)
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async function signOut() {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      errorMessage,
      isAuthenticated: Boolean(session),
      isLoading,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [errorMessage, isLoading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
