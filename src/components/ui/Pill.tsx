import { Clock, Megaphone, ShieldCheck, Sparkles, TriangleAlert, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { verifiedLabel } from '@/lib/format'

type Kind = 'verified' | 'closing' | 'caution' | 'sponsored' | 'new' | 'bago' | 'neutral' | 'open' | 'offline'

const styles: Record<Kind, string> = {
  verified: 'bg-ok-bg text-ok',
  open: 'bg-ok-bg text-ok',
  closing: 'bg-danger-bg text-danger',
  caution: 'bg-caution-bg text-caution',
  sponsored: 'bg-ink/80 text-cream dark:bg-cream/90 dark:text-ink',
  new: 'bg-amber text-ink',
  bago: 'bg-amber text-ink',
  neutral: 'bg-sunken text-fg-2 dark:bg-elevated',
  offline: 'bg-caution-bg text-caution',
}

export function Pill({
  kind = 'neutral',
  children,
  icon,
  className,
  size = 'md',
}: {
  kind?: Kind
  children: ReactNode
  icon?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-display font-medium',
        size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-[12px]',
        styles[kind],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export const VerifiedPill = ({ days, size, short }: { days: number; size?: 'sm' | 'md'; short?: boolean }) => (
  <Pill kind="verified" size={size} icon={<ShieldCheck size={size === 'sm' ? 12 : 14} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />}>
    {short ? 'Verified' : verifiedLabel(days)}
  </Pill>
)
export const ClosingPill = ({ at, size }: { at?: string; size?: 'sm' | 'md' }) => (
  <Pill kind="closing" size={size} icon={<Clock size={size === 'sm' ? 12 : 14} strokeWidth={2} />}>
    Magsasara na{at ? ` · ${at}` : ''}
  </Pill>
)
export const SponsoredTag = ({ className }: { className?: string }) => (
  <Pill kind="sponsored" size="sm" icon={<Megaphone size={11} strokeWidth={2} />} className={className}>
    Sponsored
  </Pill>
)
export const NewTag = ({ label = 'BAGO' }: { label?: string }) => (
  <Pill kind="new" size="sm" icon={<Sparkles size={11} strokeWidth={2} />}>
    {label}
  </Pill>
)
export const QueuePill = ({ queue }: { queue: 'maikli' | 'mahaba' }) =>
  queue === 'mahaba' ? (
    <Pill kind="caution" size="sm" icon={<Users size={12} strokeWidth={2} />}>
      Mahaba ang pila
    </Pill>
  ) : null
export const CautionPill = ({ children }: { children: ReactNode }) => (
  <Pill kind="caution" size="sm" icon={<TriangleAlert size={12} strokeWidth={2} />}>
    {children}
  </Pill>
)
