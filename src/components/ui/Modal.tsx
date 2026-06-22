import { useEffect, useState, type ReactNode, type CSSProperties } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}

const CLOSE_MS = 200

export function Modal({ open, title, onClose, children, footer, width }: ModalProps) {
  // Keep the modal mounted through its closing animation, then unmount.
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => { setMounted(true); setClosing(false) })
      return () => cancelAnimationFrame(raf)
    }
    if (!mounted) return
    const raf = requestAnimationFrame(() => setClosing(true))
    const t = setTimeout(() => { setMounted(false); setClosing(false) }, CLOSE_MS)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [open, mounted])

  if (!mounted) return null

  const style: CSSProperties = width ? { maxWidth: width } : {}

  return (
    <div className={`modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`} onClick={onClose}>
      <div className={`modal${closing ? ' modal--closing' : ''}`} style={style} onClick={e => e.stopPropagation()}>
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
