import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export function ProgressRing({
  value,
  size = 72,
  stroke = 8,
  color = 'var(--c-primary)',
  track = 'var(--c-sunken)',
  children,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: React.ReactNode
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Donut({
  segments,
  size = 140,
  stroke = 22,
  children,
}: {
  segments: { value: number; color: string; label: string }[]
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--c-sunken)" strokeWidth={stroke} fill="none" />
        {segments.map((s) => {
          const len = (s.value / total) * c
          const gap = segments.length > 1 ? 3 : 0
          const el = (
            <motion.circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
              initial={{ strokeDashoffset: -acc + 30, opacity: 0 }}
              animate={{ strokeDashoffset: -acc, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )
          acc += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function Bar({ value, max, color = 'var(--c-primary)', planned }: { value: number; max: number; color?: string; planned?: number }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-sunken dark:bg-elevated">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {planned != null && (
        <div className="absolute inset-y-0 w-[2px] bg-fg" style={{ left: `${Math.min(100, (planned / max) * 100)}%` }} aria-hidden />
      )}
    </div>
  )
}
