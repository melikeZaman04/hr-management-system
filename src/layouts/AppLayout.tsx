import { Outlet } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Sidebar } from '../components/layout/Sidebar'
import { useAuth } from '../features/auth/useAuth'
import { Icon } from '../components/ui/Icon'

function ProfileMissingBanner() {
  return (
    <div
      className="alert alert--warning"
      style={{ margin: 'var(--sp-4) var(--sp-6) 0', borderRadius: 'var(--r-md)' }}
    >
      <Icon name="alert" size={14} />
      <div>
        Hesabınız için profil kaydı bulunmuyor. Bazı özellikler kısıtlanabilir.
        Çözüm için İK yöneticinizle iletişime geçin.
      </div>
    </div>
  )
}

function ProfileLoadErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="alert alert--danger"
      style={{ margin: 'var(--sp-4) var(--sp-6) 0', borderRadius: 'var(--r-md)' }}
    >
      <Icon name="alert" size={14} />
      <div>
        Profil bilgisi yüklenemedi. Bazı özellikler kısıtlanabilir.
        {message ? <> Hata: <span style={{ fontFamily: 'var(--font-mono)' }}>{message}</span></> : null}
      </div>
    </div>
  )
}

export function AppLayout() {
  const { isAuthenticated, isLoading, profileStatus, profileErrorMessage } = useAuth()
  const showProfileMissingWarning = !isLoading && isAuthenticated && profileStatus === 'missing'
  const showProfileLoadError = !isLoading && isAuthenticated && profileStatus === 'error'

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Header />
        {showProfileMissingWarning && <ProfileMissingBanner />}
        {showProfileLoadError && <ProfileLoadErrorBanner message={profileErrorMessage ?? ''} />}
        <main className="page-shell">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

