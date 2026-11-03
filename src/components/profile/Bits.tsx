import { Star } from 'lucide-react'
import type { Place } from '@/data/places'
import { cn } from '@/lib/cn'

/** Shared small pieces for the business profile. */
export function BizLogo({ place, size = 40, className }: { place: Place; size?: number; className?: string }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center font-display font-bold text-white', className)} style={{ width: size, height: size, borderRadius: size * 0.3, background: place.logo.color, fontSize: size * 0.36 }} aria-hidden>
      {place.logo.initials}
    </span>
  )
}

const tints = ['#FF6A00', '#3A1A0E', '#C84A00', '#8A5A2B', '#E0A100', '#5B7A3A']
export function PersonAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tints.length
  const ini = name.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white" style={{ width: size, height: size, background: tints[i], fontSize: size * 0.38 }} aria-hidden>
      {ini}
    </span>
  )
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-amber', className)} role="img" aria-label={`${value} sa 5 bituin`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={n <= Math.round(value) ? 0 : 1.75} className={n <= Math.round(value) ? '' : 'text-line'} />
      ))}
    </span>
  )
}

/** Tagalog relative time. */
export function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'Ngayon lang'
  if (s < 3600) return `${Math.round(s / 60)} min`
  if (s < 86400) return `${Math.round(s / 3600)} oras`
  if (s < 7 * 86400) return `${Math.round(s / 86400)} araw`
  return new Date(iso).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })
}
