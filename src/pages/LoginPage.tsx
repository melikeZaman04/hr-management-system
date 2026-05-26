import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'

type LoginLocationState = { from?: { pathname?: string } }

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
      setErrorMessage(error instanceof Error ? error.message : 'Giriş başarısız.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="sidebar__brand-mark">HRC</div>
          <div style={{ fontWeight: 600, fontSize: 'var(--fs-15)', letterSpacing: '-0.01em' }}>HRCore</div>
        </div>

        <div className="login__body">
          <h1 className="login__title">Giriş yap</h1>
          <p className="login__subtitle">Devam etmek için iş e-postanı kullan.</p>

          {errorMessage && (
            <div className="alert alert--danger" style={{ marginBottom: 'var(--sp-4)' }}>
              <Icon name="alert" size={14} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form className="login__form" onSubmit={handleSubmit}>
            <Field label="İş e-postası" required htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="ad@firma.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Şifre" required htmlFor="password">
              <Input
                id="password"
                type="password"
                placeholder="Şifreni gir"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" block loading={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
