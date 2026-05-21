import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

export function Header() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <div>
        <p className="eyebrow">Admin / HR MVP</p>
        <h1>HR Management System</h1>
      </div>
      <div className="header-actions">
        <div>
          <span className="header-user-label">Signed in as</span>
          <strong>{user?.email ?? 'Unknown user'}</strong>
        </div>
        <button className="secondary-button" onClick={handleSignOut} type="button">
          Logout
        </button>
      </div>
    </header>
  )
}
