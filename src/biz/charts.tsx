import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { cn } from '@/lib/cn'
import { useReducedMotion } from '@/lib/useMedia'

const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

export function Sparkline({ data, color = 'var(--c-primary)', className, height = 36 }: { data: number[]; color?: string; className?: string; height?: number }) {
  const id = useId().replace(/:/g, '')
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * 100, 4 + (1 - (v - min) / (max - min || 1)) * (height - 8)] as [number, number])
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className={cn('w-full', className)} style={{ height }} aria-hidden>
      <defs>
        <linearGradient id={`sp${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.28} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${path(pts)} L100 ${height} L0 ${height} Z`} fill={`url(#sp${id})`} />
      <path d={path(pts)} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Responsive line chart with an optional comparison series and hover readout. */
export function LineChart({ data, compare, labels, color = 'var(--c-primary)', height = 220, format = (n: number) => String(n), ariaLabel }: { data: number[]; compare?: number[]; labels: string[]; color?: string; height?: number; format?: (n: number) => string; ariaLabel: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const reduce = useReducedMotion()
  const W = 600
  const H = height
  const pad = { l: 36, r: 26, t: 12, b: 26 }
  const max = Math.max(...data, ...(compare ?? []), 1) * 1.1
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const pts = data.map((v, i) => [x(i), y(v)] as [number, number])
  const ticks = [0, 0.5, 1].map((k) => Math.round(max * k))
  const step = Math.ceil(labels.length / 7)
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tk)} y2={y(tk)} stroke="var(--c-line)" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y(tk) + 4} textAnchor="end" fontSize={11} fill="var(--c-fg-2)">
              {format(tk)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--c-fg-2)">
              {l}
            </text>
          ) : null,
        )}
        {compare && <path d={path(compare.map((v, i) => [x(i), y(v)]))} fill="none" stroke="var(--c-muted)" strokeWidth={2} strokeDasharray="5 5" />}
        <path d={`${path(pts)} L${x(data.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill={color} opacity={0.12} />
        <motion.path d={path(pts)} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
        {data.map((v, i) => (
          <rect key={i} x={x(i) - (W / data.length) / 2} y={0} width={W / data.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
        ))}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--c-fg-2)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(data[hover])} r={5} fill={color} stroke="var(--c-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-1 rounded-[12px] bg-brown px-2.5 py-1.5 text-[13px] text-cream shadow-float dark:bg-elevated" style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 50px), calc(100% - 110px))` }}>
          <b className="font-display">{format(data[hover])}</b> · {labels[hover]}
          {compare && <span className="block text-[12px] opacity-80">vs {format(compare[hover])}</span>}
        </div>
      )}
    </div>
  )
}

export function BarChart({ data, labels, highlight, height = 160, ariaLabel, color = 'var(--c-primary)' }: { data: number[]; labels: string[]; highlight?: number; height?: number; ariaLabel: string; color?: string }) {
  const max = Math.max(...data, 1)
  const reduce = useReducedMotion()
  return (
    <div role="img" aria-label={ariaLabel} className="flex items-end gap-1.5" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="font-display text-[11px] font-semibold text-fg-2">{v}</span>
          <motion.div
            className="w-full rounded-t-[8px]"
            style={{ background: i === highlight ? color : 'var(--c-sunken)', boxShadow: i === highlight ? 'none' : 'inset 0 0 0 1px var(--c-line)' }}
            initial={reduce ? false : { height: 0 }}
            animate={{ height: (v / max) * (height - 40) }}
            transition={{ duration: 0.6, delay: i * 0.03 }}
          />
          <span className="truncate text-[11px] text-fg-2">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0]?.value || 1
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const w = Math.max(12, (s.value / max) * 100)
        const conv = i ? Math.round((s.value / steps[i - 1].value) * 100) : 100
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[14px]">
              <span className="font-display font-medium">{s.label}</span>
              <span className="text-fg-2">
                <b className="font-display text-fg">{s.value.toLocaleString('en-PH')}</b>
                {i > 0 && <span className="ml-1.5 text-[12px]">({conv}%)</span>}
              </span>
            </div>
            <div className="h-9 overflow-hidden rounded-[10px] bg-sunken dark:bg-elevated">
              <motion.div className="h-full rounded-[10px]" style={{ background: ['#FF6A00', '#FF8A33', '#FFB400', '#6B3A22'][i] }} initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.7, delay: i * 0.1 }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** 7 x 24 heat strip of busy hours. */
export function HeatStrip({ grid, days, hours = [6, 23] }: { grid: number[][]; days: string[]; hours?: [number, number] }) {
  const cols = Array.from({ length: hours[1] - hours[0] }, (_, i) => hours[0] + i)
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-[3px]" aria-label="Peak hours">
        <thead>
          <tr>
            <th />
            {cols.map((h) => (
              <th key={h} className="text-[10px] font-normal text-fg-2" scope="col">
                {h % 3 === 0 ? `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, d) => (
            <tr key={d}>
              <th scope="row" className="pr-1 text-left font-display text-[11px] font-medium text-fg-2">
                {days[d]}
              </th>
              {cols.map((h) => {
                const v = row[h]
                return <td key={h} title={`${days[d]} ${h}:00 · ${Math.round(v * 100)}%`} className="h-6 min-w-[14px] rounded-[5px]" style={{ background: v < 0.05 ? 'var(--c-sunken)' : `color-mix(in srgb, var(--c-primary) ${Math.round(15 + v * 85)}%, var(--c-surface))` }} />
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} strokeWidth={1.75} className={i <= Math.round(value) ? 'fill-amber text-amber' : 'text-line'} />
      ))}
    </span>
  )
}
