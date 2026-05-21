import type { ReactNode, CSSProperties } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export function Modal({ open, title, onClose, children, footer, width }: ModalProps) {
  if (!open) return null
  const style: CSSProperties = width ? { maxWidth: width } : {}
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={style} onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">{title}</div>
          <Button variant="ghost" size="sm" icon="x" onClick={onClose} aria-label="Close" />
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  )
}
