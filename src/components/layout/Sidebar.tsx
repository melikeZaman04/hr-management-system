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
    { section: 'Workspace', items: [
      { id: 'dashboard',  label: 'Dashboard',          icon: 'dashboard', to: '/dashboard' },
      { id: 'employees',  label: 'Employees',           icon: 'users',     to: '/employees' },
      { id: 'leave',      label: 'Leave Requests',      icon: 'calendar',  to: '/leave-requests' },
    ]},
    { section: 'Operations', items: [
      { id: 'salary',     label: 'Salary Calculation',  icon: 'wallet',    to: '/salary-calculation' },
      { id: 'devices',    label: 'Devices',             icon: 'laptop',    to: '/devices' },
      { id: 'documents',  label: 'Documents',           icon: 'document',  to: '/documents' },
    ]},
    { section: 'System', items: [
      { id: 'audit',      label: 'Audit Log',           icon: 'shield',    to: '/audit' },
    ]},
  ],
  manager: [
    { section: 'Workspace', items: [
      { id: 'dashboard',  label: 'Team Overview',       icon: 'dashboard', to: '/dashboard' },
      { id: 'employees',  label: 'My Team',             icon: 'users',     to: '/employees' },
      { id: 'leave',      label: 'Team Leave',          icon: 'calendar',  to: '/leave-requests' },
    ]},
  ],
  employee: [
    { section: 'Me', items: [
      { id: 'dashboard',  label: 'Dashboard',           icon: 'dashboard', to: '/dashboard' },
      { id: 'profile',    label: 'My Profile',          icon: 'user',      to: '/profile' },
      { id: 'leave',      label: 'My Leave Requests',   icon: 'calendar',  to: '/leave-requests' },
    ]},
    { section: 'Resources', items: [
      { id: 'devices',    label: 'My Devices',          icon: 'laptop',    to: '/devices' },
      { id: 'documents',  label: 'My Documents',        icon: 'document',  to: '/documents' },
    ]},
  ],
}

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const role = 'admin_hr'
  const sections = NAV[role] ?? NAV.admin_hr

  const displayName = user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split('@')[0] ?? 'User'
  const email = user?.email ?? ''

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">N</div>
        <div>
          <div className="sidebar__brand-name">Northwind HR</div>
          <div className="sidebar__brand-org">Acme Industries</div>
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
