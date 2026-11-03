import { Check, ChevronLeft, ChevronRight, Clock, CloudOff, Lock, Minus, SkipForward, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { ThemeStatus } from '@/app/account'
import { useT } from '@/app/i18n'
import { cn } from '@/lib/cn'
import { Jimbot, type Expression } from '../mascot/Jimbot'
import { ProgressRing } from '../ui/Charts'

/* ------------------------------ Step progress dots ------------------------------ */

export function StepDots({ total, current, className }: { total: number; current: number; className?: string }) {
  const t = useT()
  return (
    <div className={cn('flex items-center gap-1.5', className)} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={t(`Hakbang ${current} sa ${total}`, `Step ${current} of ${total}`)}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ width: i + 1 === current ? 26 : 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn('block h-2 rounded-full', i + 1 <= current ? 'bg-primary' : 'bg-line dark:bg-white/15')}
        />
      ))}
    </div>
  )
}

/** Big back button (label + chevron, 48px target) used on every one-decision screen. */
export function BigBack({ onClick, className }: { onClick: () => void; className?: string }) {
  const t = useT()
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn('-ml-1 inline-flex h-12 items-center gap-0.5 rounded-full bg-surface pl-2 pr-4 font-display text-[16px] font-medium text-link shadow-card dark:bg-elevated', className)}
    >
      <ChevronLeft size={24} strokeWidth={2.2} />
      {t('Bumalik', 'Back')}
    </motion.button>
  )
}

export function StepHeader({ step, total = 5, onBack, right }: { step?: number; total?: number; onBack?: (() => void) | 'history'; right?: ReactNode }) {
  const navigate = useNavigate()
  const back = onBack === 'history' ? () => navigate(-1) : onBack
  return (
    <header className="sticky top-0 z-20 bg-bg/92 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[480px] items-center justify-between gap-3 px-5">
        {back ? <BigBack onClick={back} /> : <span className="w-12" />}
        {step != null && <StepDots total={total} current={step} />}
        <div className="flex min-w-12 justify-end">{right}</div>
      </div>
    </header>
  )
}

export function SavedNote({ className }: { className?: string }) {
  const t = useT()
  return (
    <p className={cn('flex items-center justify-center gap-1.5 text-[13px] text-fg-2', className)}>
      <Check size={14} className="text-ok" strokeWidth={3} /> {t('Awtomatikong naka-save', 'Saved automatically')}
    </p>
  )
}

/* ------------------------------ Tags & chips ------------------------------ */

export function ReqTag({ className }: { className?: string }) {
  const t = useT()
  return <span className={cn('inline-flex h-6 items-center rounded-full bg-primary px-2.5 font-display text-[12px] font-semibold text-ink', className)}>{t('Kailangan', 'Required')}</span>
}
export function OptTag({ className }: { className?: string }) {
  const t = useT()
  return <span className={cn('inline-flex h-6 items-center rounded-full border border-line bg-sunken px-2.5 font-display text-[12px] font-medium text-fg-2 dark:bg-elevated', className)}>{t('Opsyonal', 'Optional')}</span>
}

export type BizStatus = 'draft' | 'live' | 'verified' | 'pending'
export function StatusChip({ status, className }: { status: BizStatus; className?: string }) {
  const t = useT()
  const m = {
    draft: { cls: 'bg-sunken text-fg-2 dark:bg-elevated', dot: 'bg-muted', label: t('Draft, hindi pa nakikita', 'Draft, not visible') },
    live: { cls: 'bg-caution-bg text-caution', dot: 'bg-caution', label: t('Live, hindi pa verified', 'Live, not yet verified') },
    pending: { cls: 'bg-caution-bg text-caution', dot: 'bg-caution', label: t('Live, sinusuri ang permit', 'Live, verification in review') },
    verified: { cls: 'bg-ok-bg text-ok', dot: 'bg-ok', label: t('Live at Verified', 'Live and Verified') },
  }[status]
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-3 font-display text-[13px] font-semibold', m.cls, className)}>
      <span className={cn('h-2 w-2 rounded-full', m.dot, status !== 'draft' && 'animate-pulse')} />
      {m.label}
    </span>
  )
}

export function ThemeStatusLabel({ status }: { status?: ThemeStatus }) {
  const t = useT()
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 font-display text-[13px] font-semibold text-ok">
        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ok text-white dark:text-ink">
          <Check size={12} strokeWidth={3.5} />
        </span>
        {t('Tapos', 'Done')}
      </span>
    )
  if (status === 'skipped')
    return (
      <span className="inline-flex items-center gap-1 font-display text-[13px] font-medium text-fg-2">
        <SkipForward size={14} /> {t('Na-skip', 'Skipped')}
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 font-display text-[13px] font-medium text-fg-2">
      <Minus size={14} /> {t('Hindi pa nagagawa', 'Not started')}
    </span>
  )
}

export function TimeEstimate({ minutes }: { minutes: number }) {
  const t = useT()
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-fg-2">
      <Clock size={13} /> {minutes > 2 ? t(`${minutes} minuto`, `${minutes} minutes`) : t('2 minuto o mas maikli', '2 minutes or less')}
    </span>
  )
}

/* ------------------------------ Theme card ------------------------------ */

export function ThemeCard({
  icon: Icon,
  title,
  minutes,
  status,
  tag,
  onClick,
  active,
  layout = 'tile',
  locked,
}: {
  icon: LucideIcon
  title: string
  minutes: number
  status?: ThemeStatus
  tag?: 'required' | 'optional'
  onClick: () => void
  active?: boolean
  layout?: 'tile' | 'row'
  locked?: boolean
}) {
  const done = status === 'done'
  const iconBox = (
    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] transition-colors', done ? 'bg-ok-bg text-ok' : active ? 'bg-primary text-ink' : 'bg-sunken text-link dark:bg-elevated')}>
      {locked ? <Lock size={22} /> : <Icon size={24} strokeWidth={1.9} />}
    </span>
  )
  if (layout === 'row')
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className={cn('flex w-full items-center gap-3 rounded-[20px] border-2 bg-surface p-3 text-left shadow-card transition-colors', active ? 'border-primary' : 'border-transparent dark:border-line/60')}
      >
        {iconBox}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-display text-[16px] font-semibold leading-tight">{title}</span>
            {tag === 'required' && <ReqTag className="h-5 px-2 text-[11px]" />}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <ThemeStatusLabel status={status} />
            {!done && <TimeEstimate minutes={minutes} />}
          </span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-muted" />
      </motion.button>
    )
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn('relative flex min-h-[156px] flex-col items-start rounded-[22px] border-2 bg-surface p-3.5 text-left shadow-card transition-colors', active ? 'border-primary' : 'border-transparent dark:border-line/60')}
    >
      <div className="flex w-full items-start justify-between">
        {iconBox}
        {tag === 'required' && <ReqTag className="h-5 px-2 text-[11px]" />}
        {tag === 'optional' && <OptTag className="h-5 px-2 text-[11px]" />}
      </div>
      <span className="mt-3 font-display text-[16px] font-semibold leading-tight">{title}</span>
      <span className="mt-auto pt-2">
        <ThemeStatusLabel status={status} />
      </span>
      {!done && (
        <span className="mt-0.5">
          <TimeEstimate minutes={minutes} />
        </span>
      )}
    </motion.button>
  )
}

/* ------------------------------ Completeness ring ------------------------------ */

export function CompletenessRing({ value, size = 92, stroke = 10, caption, tone = 'default' }: { value: number; size?: number; stroke?: number; caption?: string; tone?: 'default' | 'onOrange' }) {
  return (
    <ProgressRing value={value} size={size} stroke={stroke} color={tone === 'onOrange' ? 'var(--c-cream)' : value >= 1 ? 'var(--c-ok)' : 'var(--c-primary)'} track={tone === 'onOrange' ? 'rgba(43,19,10,.18)' : 'var(--c-sunken)'}>
      <span className="flex flex-col items-center leading-none">
        <span className={cn('font-display font-bold', tone === 'onOrange' ? 'text-white' : 'text-fg')} style={{ fontSize: size * 0.24 }}>
          {Math.round(value * 100)}%
        </span>
        {caption && <span className={cn('mt-0.5 font-display text-[11px] font-medium', tone === 'onOrange' ? 'text-ink' : 'text-fg-2')}>{caption}</span>}
      </span>
    </ProgressRing>
  )
}

/* ------------------------------ Big skip button ------------------------------ */

export function BigSkip({ onClick, label, className }: { onClick: () => void; label?: string; className?: string }) {
  const t = useT()
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn('flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-line font-display text-[16px] font-medium text-fg-2 transition-colors hover:border-muted', className)}
    >
      <SkipForward size={19} />
      {label ?? t('Laktawan', 'Skip')}
    </motion.button>
  )
}

/* ------------------------------ Jimbot speech ------------------------------ */

export function JimbotSays({ pose = 'idea', children, size = 64, className }: { pose?: Expression; children: ReactNode; size?: number; className?: string }) {
  return (
    <div className={cn('flex items-end gap-2', className)}>
      <Jimbot expression={pose} variant="standalone" size={size} className="-mb-1 shrink-0" />
      <div className="relative mb-2 flex-1 rounded-[20px] rounded-bl-md bg-surface px-4 py-3 text-[15px] leading-snug shadow-card dark:bg-elevated">{children}</div>
    </div>
  )
}

/** Small tooltip from Jimbot (tips, "Did you know"). */
export function JimbotTip({ children, pose = 'idea', className }: { children: ReactNode; pose?: Expression; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-[18px] bg-sunken p-3 text-[14px] leading-snug text-fg-2 dark:bg-elevated', className)}>
      <Jimbot crop="head" expression={pose} size={32} animate={false} />
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  )
}

/* ------------------------------ Question block ------------------------------ */

export function Question({ n, title, hint, tag, error, children, id }: { n?: number; title: string; hint?: string; tag?: 'required' | 'optional'; error?: string | null; children: ReactNode; id?: string }) {
  return (
    <fieldset className="min-w-0" aria-invalid={!!error} id={id}>
      <legend className="mb-3 flex w-full flex-wrap items-center gap-2">
        {n != null && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brown font-display text-[12px] font-semibold text-cream dark:bg-elevated">{n}</span>}
        <span className="font-display text-[17px] font-semibold leading-tight">{title}</span>
        {tag === 'required' && <ReqTag />}
        {tag === 'optional' && <OptTag />}
      </legend>
      {hint && <p className="-mt-1.5 mb-3 text-[14px] text-fg-2">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="mt-2 text-[14px] font-semibold text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/* ------------------------------ Price chips ------------------------------ */

export function PriceChips({ value, onChange, hints }: { value?: string; onChange: (v: string) => void; hints: Record<string, string> }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup">
      {Object.keys(hints).map((p) => {
        const on = value === p
        return (
          <motion.button
            key={p}
            whileTap={{ scale: 0.95 }}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p)}
            className={cn('flex flex-col items-center rounded-[18px] border-2 px-2 py-3 transition-colors', on ? 'border-primary bg-primary text-ink' : 'border-line bg-surface dark:bg-elevated')}
          >
            <span className="font-display text-[22px] font-bold tracking-wider">{p}</span>
            <span className={cn('mt-0.5 text-center text-[12px] leading-tight', on ? 'text-ink' : 'text-fg-2')}>{hints[p]}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ------------------------------ Offline banner ------------------------------ */

export function OfflineSaveBanner({ className }: { className?: string }) {
  const t = useT()
  return (
    <div role="status" className={cn('flex items-center gap-3 rounded-[18px] bg-caution-bg px-4 py-3 text-caution', className)}>
      <CloudOff size={20} className="shrink-0" />
      <p className="text-[14px] font-semibold leading-snug">{t('Offline ka. Nase-save sa device at isi-sync pagbalik ng internet.', "You're offline. Saved on this device and will sync when you're back online.")}</p>
    </div>
  )
}
