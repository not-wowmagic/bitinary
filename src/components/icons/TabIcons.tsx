/** Custom 24px / 1.75 stroke tab icons with outline + filled (active) variants. */
type P = { active?: boolean; size?: number; className?: string }
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function HomeIcon({ active, size = 24, className }: P) {
  return (
    <svg {...base(size)} className={className}>
      {active ? (
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M10.9 3.1a1.75 1.75 0 0 1 2.2 0l7.25 5.9c.4.33.65.83.65 1.36V19.5A1.75 1.75 0 0 1 19.25 21.25H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H4.75A1.75 1.75 0 0 1 3 19.5v-9.14c0-.53.24-1.03.65-1.36z"
        />
      ) : (
        <path d="M3.75 10.36c0-.3.13-.58.36-.77l7.25-5.9a1 1 0 0 1 1.28 0l7.25 5.9c.23.19.36.47.36.77v9.14a1 1 0 0 1-1 1H15v-5.25a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.25H4.75a1 1 0 0 1-1-1z" />
      )}
    </svg>
  )
}

export function SearchIcon({ active, size = 24, className }: P) {
  return (
    <svg {...base(size)} strokeWidth={active ? 2.6 : 1.75} className={className}>
      <circle cx="10.75" cy="10.75" r="6.75" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <path d="m20.25 20.25-4.5-4.5" />
    </svg>
  )
}

export function UserIcon({ active, size = 24, className }: P) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="4" fill={active ? 'currentColor' : 'none'} />
      <path d="M4.5 20.25c.9-3.6 3.9-5.75 7.5-5.75s6.6 2.15 7.5 5.75" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

/** Polaroid instant camera */
export function PolaroidIcon({ active, size = 24, className }: P) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 6.25V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.25" />
      <rect x="3" y="6.25" width="18" height="12.5" rx="3" fill={active ? 'currentColor' : 'none'} />
      <circle cx="12" cy="12" r="3.25" fill={active ? 'var(--c-primary)' : 'none'} stroke={active ? 'var(--c-primary)' : 'currentColor'} />
      <path d="M17 9h.01" stroke={active ? 'var(--c-primary)' : 'currentColor'} strokeWidth={2.4} />
      <path d="M7.5 18.75v1.5a.75.75 0 0 0 .75.75h7.5a.75.75 0 0 0 .75-.75v-1.5" />
    </svg>
  )
}

/**
 * Jimbot tab icon: the full fox mascot artwork without a circular crop.
 */
export function FoxIcon({ active, size = 24, className }: P) {
  return <img src={hello} alt="" width={size} height={size} aria-hidden="true" className={className} style={{ width: size, height: size, objectFit: 'contain' }} />
}
import hello from '@/assets/jimbot/hello.png'
