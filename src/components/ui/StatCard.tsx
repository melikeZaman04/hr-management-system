import { Icon } from './Icon'

interface StatCardProps {
  label: string
  value: string
  icon?: string
  delta?: string
  deltaDir?: 'up' | 'down'
  sparkline?: string
}

export function StatCard({ label, value, icon, delta, deltaDir, sparkline }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__row">
        <div className="stat-card__label">{label}</div>
        {icon && <div className="stat-card__icon"><Icon name={icon as never} size={14} /></div>}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__row">
        {delta && (
          <div className={`stat-card__delta${deltaDir === 'up' ? ' stat-card__delta--up' : deltaDir === 'down' ? ' stat-card__delta--down' : ''}`}>
            {deltaDir === 'up'   && <Icon name="arrowUp" size={12} />}
            {deltaDir === 'down' && <Icon name="arrowDown" size={12} />}
            {delta}
          </div>
        )}
        {sparkline && (
          <svg viewBox="0 0 80 24" preserveAspectRatio="none" className="stat-card__sparkline" style={{ width: 100 }}>
            <path d={sparkline} fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>
    </div>
  )
}
