import type { ReactNode } from 'react'

interface DetailFieldProps {
  label: string
  value?: ReactNode
  mono?: boolean
  muted?: boolean
}

export function DetailField({ label, value, mono, muted }: DetailFieldProps) {
  return (
    <div className="detail-field">
      <div className="detail-field__label">{label}</div>
      <div className={`detail-field__value${mono ? ' detail-field__value--mono' : ''}${muted ? ' detail-field__value--muted' : ''}`}>
        {value ?? <span className="text-ter">—</span>}
      </div>
    </div>
  )
}
