import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from './profileService'

export type AuthContextValue = {
  errorMessage: string | null
  isAuthenticated: boolean
  isLoading: boolean
  session: Session | null
  profile: Profile | null
  profileStatus: 'loading' | 'loaded' | 'missing' | 'error'
  profileErrorMessage: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  user: User | null
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
