import { useEffect, useRef, useState, type ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  eyebrow?: string
  subtitle?: string
  breadcrumb?: string
  actions?: ReactNode
}

/** Walk up from the sentinel to find the nearest scrollable ancestor (the sticky
 *  scroll container). Falls back to the viewport (null) when none is found. */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return null
}

export function PageHeader({ title, eyebrow, subtitle, breadcrumb, actions }: PageHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const root = findScrollParent(sentinel)
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { root, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Zero-height sentinel — leaves the scroll container exactly when the
          sticky header pins, toggling the stuck state without scroll listeners. */}
      <div ref={sentinelRef} className="page-header__sentinel" aria-hidden="true" />
      <div className={`page-header${stuck ? ' page-header--stuck' : ''}`}>
        <div className="page-header__titles">
          {breadcrumb && <div className="page-header__breadcrumb">{breadcrumb}</div>}
          {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
          <div className="page-header__title">{title}</div>
          {subtitle && <div className="page-header__subtitle">{subtitle}</div>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </>
  )
}
