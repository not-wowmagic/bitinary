/** Business nav icons: 24px grid, 1.75 stroke, filled when active. */
type P = { active?: boolean; size?: number; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export function StatsIcon({ active, size = 24, className }: P) {
  const f = active ? 'currentColor' : 'none'
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="12" width="4" height="8.5" rx="1.2" fill={f} />
      <rect x="10" y="7" width="4" height="13.5" rx="1.2" fill={f} />
      <rect x="16.5" y="3.5" width="4" height="17" rx="1.2" fill={f} />
    </svg>
  )
}

export function ContentIcon({ active, size = 24, className }: P) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill={active ? 'currentColor' : 'none'} />
      <path d="M7.5 9h9M7.5 12.5h9M7.5 16h5" stroke={active ? 'var(--c-primary)' : 'currentColor'} />
    </svg>
  )
}

export { FoxIcon, SearchIcon, UserIcon } from '@/components/icons/TabIcons'
