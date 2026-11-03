import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { PhaseTag } from './PhaseTag'

export function SectionHeader({
  title,
  action,
  onAction,
  phase,
  className,
}: {
  title: ReactNode
  action?: string
  onAction?: () => void
  phase?: 'MVP' | 'P2' | 'P3'
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-3 px-4 md:px-0', className)}>
      <h2 className="flex items-center gap-2 text-h2 text-fg">
        {title}
        {phase && <PhaseTag phase={phase} />}
      </h2>
      {action && (
        <button onClick={onAction} className="-mr-2 inline-flex h-11 items-center gap-0.5 rounded-full px-2 font-display text-[14px] font-medium text-link">
          {action}
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:scroll-px-0 md:px-0', className)}>
      {children}
    </div>
  )
}
