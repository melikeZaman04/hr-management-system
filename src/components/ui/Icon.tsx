import type { CSSProperties } from 'react'

const ICONS: Record<string, React.ReactNode> = {
  logo: <><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"/><path d="M8 8v8M8 12h8M16 8v8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></>,
  dashboard:   <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></>,
  users:       <><circle cx="9" cy="8" r="3.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 19c0-2.2 1.5-4 4-4"/></>,
  calendar:    <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  wallet:      <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M17 14h.01"/></>,
  laptop:      <><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/></>,
  document:    <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>,
  shield:      <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></>,
  user:        <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>,
  search:      <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  plus:        <><path d="M12 5v14M5 12h14"/></>,
  chevron:     <><path d="m9 6 6 6-6 6"/></>,
  chevronDown: <><path d="m6 9 6 6 6-6"/></>,
  filter:      <><path d="M4 5h16M7 12h10M10 19h4"/></>,
  download:    <><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></>,
  upload:      <><path d="M12 20V8m0 0-4 4m4-4 4 4M5 4h14"/></>,
  more:        <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  check:       <><path d="m5 12 5 5 9-11"/></>,
  x:           <><path d="M6 6l12 12M18 6 6 18"/></>,
  arrowLeft:   <><path d="M19 12H5m0 0 6-6m-6 6 6 6"/></>,
  arrowRight:  <><path d="M5 12h14m0 0-6-6m6 6-6 6"/></>,
  arrowUp:     <><path d="m6 14 6-6 6 6"/></>,
  arrowDown:   <><path d="m6 10 6 6 6-6"/></>,
  bell:        <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z"/><path d="M10 21h4"/></>,
  cog:         <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.2-1.6l2-1.6-2-3.5-2.4 1a7 7 0 0 0-2.8-1.6L13 2h-4l-.6 2.7a7 7 0 0 0-2.8 1.6l-2.4-1-2 3.5 2 1.6A7 7 0 0 0 3 12a7 7 0 0 0 .2 1.6l-2 1.6 2 3.5 2.4-1a7 7 0 0 0 2.8 1.6L9 22h6l.6-2.7a7 7 0 0 0 2.8-1.6l2.4 1 2-3.5-2-1.6c.2-.5.2-1 .2-1.6z"/></>,
  logout:      <><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M21 12H9m12 0-4-4m4 4-4 4"/></>,
  mail:        <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  phone:       <><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2 18 18 0 0 1-15-15 2 2 0 0 1 2-2z"/></>,
  briefcase:   <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></>,
  building:    <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/></>,
  inbox:       <><path d="M3 13h5l1 3h6l1-3h5"/><path d="M5 4h14l2 9v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/></>,
  empty:       <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 11h18M8 16h2"/></>,
  alert:       <><path d="M12 4 2 20h20z"/><path d="M12 10v4M12 18v.01"/></>,
  info:        <><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/></>,
  clipboard:   <><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z" fill="currentColor"/></>,
  cube:        <><path d="m12 3 9 5v8l-9 5-9-5V8z"/><path d="m3 8 9 5 9-5M12 13v9"/></>,
  paperclip:   <><path d="M21 11 12 20a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-1-1l8-8"/></>,
  sparkle:     <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></>,
  globe:       <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  trash:       <><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></>,
  edit:        <><path d="M14 4 20 10 8 22H2v-6z"/></>,
}

type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 16, stroke = 1.5, className = '', style }: IconProps) {
  const inner = ICONS[name]
  if (!inner) return null
  if (name === 'logo') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
        {inner}
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {inner}
    </svg>
  )
}
