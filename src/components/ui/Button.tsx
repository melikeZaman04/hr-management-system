import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  icon?: string
  iconRight?: string
  loading?: boolean
  children?: ReactNode
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  block,
  icon,
  iconRight,
  loading,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    size === 'lg' && 'btn--lg',
    block && 'btn--block',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={cls} disabled={disabled ?? loading} {...rest}>
      {loading
        ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
        : icon && <Icon name={icon as never} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight as never} size={14} />}
    </button>
  )
}
