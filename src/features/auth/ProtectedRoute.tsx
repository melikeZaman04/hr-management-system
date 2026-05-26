import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { UserRole } from './profileService'
import { Button } from '../../components/ui/Button'

interface Props {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, profile, profileStatus, profileErrorMessage } = useAuth()

  if (isLoading) {
    return (
      <main className="centered-page">
        <div className="state-box">Oturum kontrol ediliyor...</div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  const role = profile?.role ?? 'employee'

  if (allowedRoles && !allowedRoles.includes(role)) {
    const roleLabel = profile?.role ? profile.role : 'unknown'
    const profileLine = profile
      ? <>Rolünüz (<b>{roleLabel}</b>) bu sayfayı görüntüleyemez.</>
      : profileStatus === 'error'
        ? <>Profil bilgisi yüklenemedi. {profileErrorMessage ? <>Hata: <b>{profileErrorMessage}</b></> : null}</>
        : <>Profil kaydı bulunamadı (rol belirlenemedi). Bu durumda bazı ekranlar görünmeyebilir.</>
    return (
      <main className="centered-page">
        <div className="state-box" style={{ maxWidth: 640 }}>
          <div style={{ fontWeight: 650, marginBottom: 'var(--sp-2)' }}>Bu sayfaya erişiminiz yok</div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)', lineHeight: 1.4 }}>
            {profileLine}
            {allowedRoles.length > 0 && (
              <> İzin verilen roller: <b>{allowedRoles.join(', ')}</b>.</>
            )}
          </div>
          <div className="row gap-2">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>Panele dön</Button>
            <Button variant="ghost" onClick={() => navigate('/login')}>Giriş sayfası</Button>
          </div>
        </div>
      </main>
    )
  }

  return <Outlet />
}

