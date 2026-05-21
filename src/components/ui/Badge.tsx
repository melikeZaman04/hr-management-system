import type { ReactNode } from 'react'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  solid?: boolean
}

export function Badge({ children, tone = 'neutral', dot = true, solid }: BadgeProps) {
  const cls = `badge badge--${tone}${solid ? ' badge--solid' : ''}`
  return (
    <span className={cls}>
      {dot && !solid && <span className="badge__dot" />}
      {children}
    </span>
  )
}

const STATUS_MAP: Record<string, [Tone, string]> = {
  active:     ['success', 'Active'],
  inactive:   ['neutral', 'Inactive'],
  terminated: ['danger',  'Terminated'],
  pending:    ['warning', 'Pending'],
  approved:   ['success', 'Approved'],
  rejected:   ['danger',  'Rejected'],
  available:  ['success', 'Available'],
  assigned:   ['info',    'Assigned'],
  returned:   ['neutral', 'Returned'],
  broken:     ['danger',  'Broken'],
}

export function StatusBadge({ status }: { status: string }) {
  const [tone, label] = STATUS_MAP[status] ?? ['neutral', status]
  return <Badge tone={tone}>{label}</Badge>
}
