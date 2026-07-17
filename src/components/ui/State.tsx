import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { Skeleton } from '../Skeleton/Skeleton'
import { Spinner } from '../Spinner/Spinner'

interface EmptyStateProps {
  title: string
  desc?: string
  action?: ReactNode
  icon?: string
}
export function EmptyState({ title, desc, action, icon = 'empty' }: EmptyStateProps) {
  return (
    <div className="state">
      <div className="state__icon"><Icon name={icon as never} size={20} /></div>
      <div className="state__title">{title}</div>
      {desc && <div className="state__desc">{desc}</div>}
      {action && <div className="state__actions">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  desc?: string
  action?: ReactNode
}
export function ErrorState({ title = "Couldn't load data", desc, action }: ErrorStateProps) {
  return (
    <div className="state">
      <div className="state__icon" style={{ color: 'var(--status-danger-fg)', borderColor: 'var(--status-danger-bd)', background: 'var(--status-danger-bg)' }}>
        <Icon name="alert" size={20} />
      </div>
      <div className="state__title">{title}</div>
      {desc && <div className="state__desc">{desc}</div>}
      {action && <div className="state__actions">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state">
      <Spinner label={label} />
      <div className="state__desc">{label}</div>
    </div>
  )
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><Skeleton height={12} width={i === 0 ? '70%' : '55%'} /></td>
      ))}
    </tr>
  )
}
