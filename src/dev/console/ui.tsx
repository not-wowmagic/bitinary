import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Small building blocks for the /bitinarydev console. */
export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 pb-5">
      <div className="min-w-0">
        <h1 className="text-title md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-body text-fg-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Panel({ title, sub, action, children, className, pad = true }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 md:px-5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[17px] font-semibold">{title}</h2>}
            {sub && <p className="text-[13px] text-fg-2">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(pad && 'p-4 md:p-5')}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, sub, icon, onClick }: { label: string; value: ReactNode; sub?: string; icon: ReactNode; onClick?: () => void }) {
  const C = onClick ? 'button' : 'div'
  return (
    <C onClick={onClick} className={cn('card flex items-start gap-3 p-4 text-left', onClick && 'transition-transform hover:-translate-y-0.5')}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/12 text-link">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] text-fg-2">{label}</span>
        <span className="block font-display text-[26px] font-bold leading-tight">{value}</span>
        {sub && <span className="block text-[12px] text-fg-2">{sub}</span>}
      </span>
    </C>
  )
}

const badge = {
  neutral: 'bg-sunken text-fg-2 dark:bg-elevated',
  ok: 'bg-ok-bg text-ok',
  caution: 'bg-caution-bg text-caution',
  danger: 'bg-danger-bg text-danger',
  orange: 'bg-primary/15 text-link',
  dark: 'bg-brown text-cream dark:bg-elevated',
}
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: keyof typeof badge; className?: string }) {
  return <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 font-display text-[12px] font-medium', badge[tone], className)}>{children}</span>
}

export const field = 'h-11 w-full rounded-[12px] border border-line bg-bg px-3 text-[15px] text-fg outline-none focus:border-primary'

export function Field({ label, hint, error, children, htmlFor, className }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block font-display text-[14px] font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-[13px] font-semibold text-danger">{error}</p> : hint && <p className="mt-1 text-[13px] text-fg-2">{hint}</p>}
    </div>
  )
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <p className="font-display text-[17px] font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-[360px] text-[14px] text-fg-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const hue = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 55% 42%)` }} aria-hidden>
      {ini}
    </span>
  )
}

/** Download a text file (CSV / JSON exports). */
export function download(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
