import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../features/auth/useAuth'

interface NavItem {
  id: string
  label: string
  icon: string
  to: string
  count?: number
}
interface NavSection {
  section: string
  items: NavItem[]
}

const NAV: Record<string, NavSection[]> = {
  admin_hr: [
    {
      section: 'Çalışma Alanı',
      items: [
        { id: 'dashboard', label: 'Panel', icon: 'dashboard', to: '/dashboard' },
        { id: 'employees', label: 'Çalışanlar', icon: 'users', to: '/employees' },
        { id: 'leave', label: 'İzin Talepleri', icon: 'calendar', to: '/leave-requests' },
      ],
    },
    {
      section: 'Operasyonlar',
      items: [
        { id: 'salary', label: 'Maaş Hesaplama', icon: 'wallet', to: '/salary-calculation' },
        { id: 'devices', label: 'Cihazlar', icon: 'laptop', to: '/devices' },
        { id: 'documents', label: 'Dokümanlar', icon: 'document', to: '/documents' },
      ],
    },
  ],
  manager: [
    {
      section: 'Çalışma Alanı',
      items: [
        { id: 'dashboard', label: 'Takım Özeti', icon: 'dashboard', to: '/dashboard' },
        { id: 'employees', label: 'Takımım', icon: 'users', to: '/employees' },
        { id: 'leave', label: 'Takım İzinleri', icon: 'calendar', to: '/leave-requests' },
      ],
    },
  ],
  employee: [
    {
      section: 'Ben',
      items: [
        { id: 'dashboard', label: 'Panel', icon: 'dashboard', to: '/dashboard' },
        { id: 'profile', label: 'Profilim', icon: 'user', to: '/profile' },
        { id: 'leave', label: 'İzin Taleplerim', icon: 'calendar', to: '/leave-requests' },
      ],
    },
    {
      section: 'Kaynaklar',
      items: [
        { id: 'devices', label: 'Cihazlarım', icon: 'laptop', to: '/devices' },
        { id: 'documents', label: 'Dokümanlarım', icon: 'document', to: '/documents' },
      ],
    },
  ],
}

export function Sidebar() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const role = profile?.role ?? 'employee'
  const sections = NAV[role] ?? NAV.employee

  const displayName = profile?.full_name
    ?? user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split('@')[0] ?? 'Kullanıcı'
  const email = user?.email ?? ''

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">HRC</div>
        <div>
          <div className="sidebar__brand-name">HRCore</div>
          <div className="sidebar__brand-org">People Operations</div>
        </div>
      </div>

      {sections.map(section => (
        <div key={section.section} className="sidebar__section">
          <div className="sidebar__section-label">{section.section}</div>
          {section.items.map(item => {
            const active = location.pathname.startsWith(item.to) && item.to !== '/'
            return (
              <button
                key={item.id}
                className={`sidebar__item${active ? ' sidebar__item--active' : ''}`}
                onClick={() => navigate(item.to)}
              >
                <Icon name={item.icon as never} size={16} className="sidebar__item-icon" />
                <span>{item.label}</span>
                {item.count != null && <span className="sidebar__item-count">{item.count}</span>}
              </button>
            )
          })}
        </div>
      ))}

      <div className="sidebar__footer">
        <Avatar name={displayName} size="sm" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-13)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {email}
          </div>
        </div>
      </div>
    </aside>
  )
}
