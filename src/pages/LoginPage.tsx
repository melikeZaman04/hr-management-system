import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'

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
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="sidebar__brand-mark">N</div>
          <div style={{ fontWeight: 600, fontSize: 'var(--fs-15)', letterSpacing: '-0.01em' }}>Northwind HR</div>
        </div>

        <div className="login__body">
          <h1 className="login__title">Sign in</h1>
          <p className="login__subtitle">Welcome back. Use your work email to continue.</p>

          {errorMessage && (
            <div className="alert alert--danger" style={{ marginBottom: 'var(--sp-4)' }}>
              <Icon name="alert" size={14} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form className="login__form" onSubmit={handleSubmit}>
            <Field label="Work email" required htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password" required htmlFor="password">
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <div className="login__row-between">
              <label className="row" style={{ gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a className="login__forgot" href="#">Forgot password?</a>
            </div>

            <Button type="submit" variant="primary" size="lg" block loading={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div style={{ textAlign: 'center', fontSize: 'var(--fs-12)', color: 'var(--text-tertiary)', marginTop: 'var(--sp-2)' }}>
              Single sign-on available · <a className="login__forgot" href="#">Use SSO</a>
            </div>
          </form>
        </div>

        <div className="login__footer">
          <span>© 2026 Acme Industries</span>
          <span className="row gap-3">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Status</a>
          </span>
        </div>
      </div>

      <div className="login__feature">
        <div className="row gap-3" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-12)' }}>
          <Icon name="shield" size={14} />
          <span>SOC 2 Type II · GDPR-compliant · End-to-end encrypted</span>
        </div>

        <div className="login__feature-card">
          <div className="row gap-3">
            <Badge tone="info" dot>Internal</Badge>
            <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-tertiary)' }}>HR control center</span>
          </div>
          <div className="login__feature-quote">
            One workspace for the people who keep the company running — employees, leave, payroll, devices, and documents in one calm interface.
          </div>
          <div className="login__feature-meta">
            <Avatar name="Pınar Yıldız" />
            <div className="col" style={{ lineHeight: 1.25 }}>
              <span style={{ fontSize: 'var(--fs-13)', fontWeight: 500 }}>Pınar Yıldız</span>
              <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-tertiary)' }}>HR Generalist · People Ops</span>
            </div>
          </div>
        </div>

        <div className="login__feature-grid">
          <div className="login__feature-stat">
            <div className="login__feature-stat-v tabnum">47</div>
            <div className="login__feature-stat-l">Active employees</div>
          </div>
          <div className="login__feature-stat">
            <div className="login__feature-stat-v tabnum">6</div>
            <div className="login__feature-stat-l">Leave requests pending</div>
          </div>
          <div className="login__feature-stat">
            <div className="login__feature-stat-v tabnum">12</div>
            <div className="login__feature-stat-l">Devices assigned</div>
          </div>
        </div>
      </div>
    </div>
  )
}
