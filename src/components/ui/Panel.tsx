import type { CSSProperties, ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  actions?: ReactNode
  foot?: ReactNode
  padded?: boolean
  children: ReactNode
  style?: CSSProperties
}

export function Panel({ title, actions, foot, padded, children, style }: PanelProps) {
  return (
    <div className="panel" style={style}>
      {(title ?? actions) && (
        <div className="panel__head">
          {title && <div className="panel__head-title">{title}</div>}
          {actions && <div className="panel__head-actions">{actions}</div>}
        </div>
      )}
      {padded ? <div className="panel__body">{children}</div> : children}
      {foot && <div className="panel__foot">{foot}</div>}
    </div>
  )
}
