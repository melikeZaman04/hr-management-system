import anim from '../../styles/animations.module.css'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: number
  /** Accessible label, announced to screen readers. */
  label?: string
  className?: string
}

export function Spinner({ size = 18, label = 'Yükleniyor…', className = '' }: SpinnerProps) {
  const border = Math.max(2, Math.round(size / 9))
  const cls = [styles.spinner, anim.spinnerRotate, className].filter(Boolean).join(' ')

  return (
    <span
      className={cls}
      style={{ width: size, height: size, borderWidth: border }}
      role="status"
      aria-label={label}
    />
  )
}
