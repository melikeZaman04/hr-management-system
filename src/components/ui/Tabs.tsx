interface TabItem {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {items.map(t => (
        <button
          key={t.id}
          className={`tabs__item${active === t.id ? ' tabs__item--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null && <span className="tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

interface SegItem {
  value: string
  label: string
  count?: number
}

interface SegmentedProps {
  items: SegItem[]
  value: string
  onChange: (v: string) => void
}

export function Segmented({ items, value, onChange }: SegmentedProps) {
  return (
    <div className="seg">
      {items.map(it => (
        <button
          key={it.value}
          className={`seg__item${value === it.value ? ' seg__item--active' : ''}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count != null && <span className="seg__item-count">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}
