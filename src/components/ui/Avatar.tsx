interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ name = '', size = 'sm', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase() || '—'

  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0
  const c = (h % 6) + 1

  const sizeClass = size === 'sm' ? '' : `avatar--${size}`
  return (
    <span className={`avatar ${sizeClass} avatar--c${c} ${className}`} aria-hidden="true">
      {initials}
    </span>
  )
}
