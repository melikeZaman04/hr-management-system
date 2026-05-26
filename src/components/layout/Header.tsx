import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Panel',
  '/employees': 'Çalışanlar',
  '/leave-requests': 'İzin Talepleri',
  '/salary-calculation': 'Maaş Hesaplama',
  '/devices': 'Cihazlar',
  '/documents': 'Dokümanlar',
}

const ROLE_LABEL: Record<string, string> = {
  admin_hr: 'Yönetici · İK',
  manager: 'Yönetici',
  employee: 'Çalışan',
}
const ROLE_TONE: Record<string, 'info' | 'warning' | 'neutral'> = {
  admin_hr: 'info',
  manager: 'warning',
  employee: 'neutral',
}

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut, user } = useAuth()

  const role = profile?.role ?? 'employee'
  const displayName = profile?.full_name
    ?? user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split('@')[0] ?? 'Kullanıcı'
  const email = user?.email ?? ''

  const basePath = '/' + location.pathname.split('/')[1]
  const pageLabel = ROUTE_LABELS[basePath] ?? 'İK Sistemi'
  const crumbs = ['İK Sistemi', pageLabel]

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <div className="header__crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            {i > 0 && <span className="header__sep"><Icon name="chevron" size={14} /></span>}
            <span className={i === crumbs.length - 1 ? 'header__crumbs-current' : ''}>{c}</span>
          </span>
        ))}
      </div>

      <div className="header__spacer" />

      <Button variant="ghost" size="sm" icon="bell" aria-label="Bildirimler" />

      <div className="header__user">
        <div className="header__user-meta">
          <span className="header__user-name">{displayName}</span>
          <span className="header__user-email">{email}</span>
        </div>
        <Avatar name={displayName} size="sm" />
        <Badge tone={ROLE_TONE[role]} dot={false}>{ROLE_LABEL[role]}</Badge>
      </div>

      <Button variant="ghost" size="sm" icon="logout" onClick={handleSignOut} aria-label="Çıkış yap" />
    </header>
  )
}
