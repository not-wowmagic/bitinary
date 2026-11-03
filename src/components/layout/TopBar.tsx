import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/cn'

export function BackButton({ className, tone = 'glass', fallback = '/' }: { className?: string; tone?: 'glass' | 'dark' | 'plain'; fallback?: string }) {
  const navigate = useNavigate()
  return (
    <button
      aria-label="Bumalik"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        tone === 'glass' && 'glass shadow-float text-fg',
        tone === 'dark' && 'glass-dark text-white',
        tone === 'plain' && 'text-link',
        className,
      )}
    >
      <ChevronLeft size={24} strokeWidth={2} />
    </button>
  )
}

/** iOS large-title page header */
export function LargeTitle({ title, subtitle, left, right, className }: { title: ReactNode; subtitle?: ReactNode; left?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <header className={cn('px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))] md:px-0 md:pt-8', className)}>
      {(left || right) && (
        <div className="mb-1 flex h-11 items-center justify-between">
          <div>{left}</div>
          <div className="flex gap-1.5">{right}</div>
        </div>
      )}
      <h1 className="text-title text-fg">{title}</h1>
      {subtitle && <p className="mt-0.5 text-body text-fg-2">{subtitle}</p>}
    </header>
  )
}
