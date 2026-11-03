import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Jimbot, type Expression } from '../mascot/Jimbot'
import { Button } from '../ui/Button'

export function StateView({
  expression,
  title,
  body,
  action,
  onAction,
  secondary,
  onSecondary,
  className,
  tone = 'default',
  size = 150,
}: {
  expression: Expression
  title: string
  body?: ReactNode
  action?: string
  onAction?: () => void
  secondary?: string
  onSecondary?: () => void
  className?: string
  tone?: 'default' | 'dark'
  size?: number
}) {
  return (
    <div className={cn('flex flex-col items-center px-8 py-10 text-center', className)}>
      <Jimbot expression={expression} variant="standalone" size={size} />
      <h2 className={cn('mt-4 text-h2', tone === 'dark' ? 'text-cream' : 'text-fg')}>{title}</h2>
      {body && <p className={cn('mt-2 max-w-[320px] text-body', tone === 'dark' ? 'text-[#D7B8A3]' : 'text-fg-2')}>{body}</p>}
      {(action || secondary) && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {action && <Button onClick={onAction}>{action}</Button>}
          {secondary && (
            <Button variant="ghost" onClick={onSecondary} className={tone === 'dark' ? 'text-[#FF9A4D]' : undefined}>
              {secondary}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export const OfflineState = (p: { onRetry?: () => void; tone?: 'default' | 'dark'; body?: string }) => (
  <StateView
    expression="sleeping"
    title="Offline ka ngayon"
    body={p.body ?? 'Natutulog muna si Jimbot habang walang internet. Makikita mo pa rin ang mga naka-save mong itinerary.'}
    action="Subukan ulit"
    onAction={p.onRetry ?? (() => location.reload())}
    tone={p.tone}
  />
)

export const ErrorState = (p: { onRetry?: () => void }) => (
  <StateView
    expression="unsure"
    title="May nangyaring mali"
    body="Hindi ko ma-load ito ngayon. Hindi ako manghuhula, kaya subukan nating i-refresh."
    action="I-refresh"
    onAction={p.onRetry ?? (() => location.reload())}
  />
)
