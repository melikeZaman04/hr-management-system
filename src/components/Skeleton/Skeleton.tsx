import type { CSSProperties } from 'react'
import anim from '../../styles/animations.module.css'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  radius?: number | string
  className?: string
  /** When provided, the skeleton is exposed as a live status instead of being hidden. */
  label?: string
}

export function Skeleton({ width = '100%', height = 12, radius, className = '', label }: SkeletonProps) {
  const style: CSSProperties = { width, height }
  if (radius !== undefined) style.borderRadius = radius

  const cls = [styles.skeleton, anim.shimmer, className].filter(Boolean).join(' ')

  return (
    <span
      className={cls}
      style={style}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
