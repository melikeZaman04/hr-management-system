import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const state = location.state as LoginLocationState | null
  const redirectTo = state?.from?.pathname ?? '/dashboard'

  if (!isLoading && isAuthenticated) {
    return <Navigate replace to={redirectTo} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await signIn(email, password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Admin / HR Access</p>
        <h1>Sign in</h1>
        <p>Use a Supabase Auth account to access the HR management panel.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? (
            <div className="state-box state-box-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
