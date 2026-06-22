import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import anim from '../../styles/animations.module.css'

interface StatCardProps {
  label: string
  value: string
  icon?: string
  delta?: string
  deltaDir?: 'up' | 'down'
  sparkline?: string
}

const COUNT_MS = 600
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Animates a numeric value from 0 to its target with requestAnimationFrame.
 *  Non-numeric values (e.g. "—") render immediately; reduced motion skips the tween. */
function useCountUp(value: string): string {
  const target = Number(value)
  const animatable = value.trim() !== '' && Number.isFinite(target)
  const prefersReduced =
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const [display, setDisplay] = useState(() => {
    if (!animatable) return null
    return prefersReduced ? target : 0
  })

  useEffect(() => {
    if (!animatable) return

    // Reduced motion: jump straight to the target (still async, via rAF).
    if (prefersReduced) {
      const raf = requestAnimationFrame(() => setDisplay(target))
      return () => cancelAnimationFrame(raf)
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS)
      setDisplay(Math.round(target * easeOutCubic(progress)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, animatable, prefersReduced])

  return animatable ? String(display ?? 0) : value
}

export function StatCard({ label, value, icon, delta, deltaDir, sparkline }: StatCardProps) {
  const display = useCountUp(value)

  return (
    <div className="stat-card">
      <div className="stat-card__row">
        <div className="stat-card__label">{label}</div>
        {icon && <div className="stat-card__icon"><Icon name={icon as never} size={14} /></div>}
      </div>
      <div className={`stat-card__value ${anim.countUp}`}>{display}</div>
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
