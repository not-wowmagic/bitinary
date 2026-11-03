import { MapArt } from './MapArt'

/** Static map preview centered on a world point. */
export function MiniMap({ x, y, label, className }: { x: number; y: number; label?: string; className?: string }) {
  const w = 360
  const h = 180
  return (
    <div className={className}>
      <svg viewBox={`${x - w / 2} ${y - h / 2} ${w} ${h}`} className="h-full w-full" role="img" aria-label={label ? `Mapa: ${label}` : 'Mapa'} preserveAspectRatio="xMidYMid slice">
        <MapArt />
        <g transform={`translate(${x} ${y})`}>
          <circle r={30} fill="var(--c-primary)" opacity={0.18} />
          <path d="M0 -4 C -12 -32, -22 -36, -22 -48 A 22 22 0 1 1 22 -48 C 22 -36, 12 -32, 0 -4 Z" fill="var(--c-primary)" stroke="#fff" strokeWidth={4} />
          <circle cy={-48} r={8} fill="#fff" />
        </g>
      </svg>
    </div>
  )
}
