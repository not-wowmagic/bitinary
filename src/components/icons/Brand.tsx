/** Brand glyphs (lucide v1 dropped brand icons). Same 24px / 1.75 stroke grid. */
type P = { size?: number; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export function Facebook({ size = 24, className }: P) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15.5 3.5h-2.2A3.8 3.8 0 0 0 9.5 7.3v2.4H7v3.4h2.5v7.4h3.4v-7.4h2.6l.5-3.4h-3.1V7.7c0-.6.4-1 1-1h1.6z" />
    </svg>
  )
}

export function Instagram({ size = 24, className }: P) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17.2 6.8h.01" strokeWidth={2.4} />
    </svg>
  )
}
