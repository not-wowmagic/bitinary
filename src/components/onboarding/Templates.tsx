import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useT } from '@/app/i18n'
import { cn } from '@/lib/cn'
import { useReducedMotion } from '@/lib/useMedia'
import { Jimbot, type Expression } from '../mascot/Jimbot'
import { Button } from '../ui/Button'
import { BigBack, BigSkip, JimbotSays, OptTag, ReqTag } from './Kit'

/**
 * One-question screen template used by every customization / business theme.
 * Max 3 questions as children, a Jimbot intro line, Save + big Skip.
 * `embedded` renders it as the right-hand pane of the desktop two-column hub.
 */
export function ThemeScreen({
  title,
  intro,
  pose = 'idea',
  tag,
  embedded,
  onBack,
  onSkip,
  onSave,
  saveLabel,
  saveDisabled,
  children,
  banner,
  skipLabel,
}: {
  title: string
  intro: ReactNode
  pose?: Expression
  tag?: 'required' | 'optional'
  embedded?: boolean
  onBack: () => void
  onSkip?: () => void
  onSave: () => void
  saveLabel?: string
  saveDisabled?: boolean
  children: ReactNode
  banner?: ReactNode
  skipLabel?: string
}) {
  const t = useT()
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-title">{title}</h1>
        {tag === 'required' && <ReqTag />}
        {tag === 'optional' && <OptTag />}
      </div>
      <JimbotSays pose={pose} className="mt-4">
        {intro}
      </JimbotSays>
      {banner && <div className="mt-4">{banner}</div>}
      <div className="mt-6 space-y-7">{children}</div>
    </>
  )
  const footer = (
    <div className="space-y-2">
      <Button block size="lg" onClick={onSave} disabled={saveDisabled}>
        {saveLabel ?? t('I-save at bumalik', 'Save and go back')}
      </Button>
      {onSkip && <BigSkip onClick={onSkip} label={skipLabel} />}
    </div>
  )

  if (embedded)
    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-bg shadow-card ring-1 ring-line dark:ring-line/60">
        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6 pt-7">{body}</div>
        <div className="border-t border-line bg-bg/95 px-8 py-4 backdrop-blur-xl">{footer}</div>
      </section>
    )

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 bg-bg/92 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[560px] items-center px-5">
          <BigBack onClick={onBack} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[560px] flex-1 px-5 pb-8 pt-1">{body}</main>
      <div className="sticky bottom-0 z-10 border-t border-line bg-bg/92 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[560px] px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">{footer}</div>
      </div>
    </div>
  )
}

/* ------------------------------ Success template ------------------------------ */

const confettiColors = ['#FF6A00', '#FFB400', '#FFF1E3', '#0038A8', '#CE1126', '#FCD116']

function Confetti() {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 26 }).map((_, i) => {
        const left = (i * 37) % 100
        const delay = (i % 9) * 0.12
        return (
          <motion.span
            key={i}
            className="absolute top-[-20px] block rounded-[3px]"
            style={{ left: `${left}%`, width: 8 + (i % 3) * 3, height: 12 + (i % 4) * 2, background: confettiColors[i % confettiColors.length] }}
            initial={{ y: -40, rotate: 0, opacity: 0 }}
            animate={{ y: ['0vh', '105vh'], rotate: [0, 360 + i * 20], opacity: [0, 1, 1, 0.6] }}
            transition={{ duration: 3.2 + (i % 5) * 0.4, delay, ease: 'easeIn', repeat: 1 }}
          />
        )
      })}
    </div>
  )
}

/** Full-screen success with the Celebrate fox. */
export function SuccessScreen({
  title,
  body,
  chip,
  actions,
  aside,
  className,
}: {
  title: string
  body?: ReactNode
  chip?: ReactNode
  actions: ReactNode
  /** desktop-only right column (e.g. go-live preview) */
  aside?: ReactNode
  className?: string
}) {
  return (
    <main className={cn('relative flex min-h-dvh flex-col overflow-hidden bg-primary text-ink xl:flex-row xl:items-center xl:justify-center xl:gap-14 xl:px-16', className)}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
        <defs>
          <pattern id="succ-weave" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 17h34M17 0v34" stroke="#2B130A" strokeWidth="2.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#succ-weave)" />
      </svg>
      <Confetti />
      <div className="relative flex flex-1 flex-col xl:w-[500px] xl:flex-none">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-5 pt-[max(40px,env(safe-area-inset-top))] text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="relative">
            <div className="absolute inset-[6%] rounded-full bg-white/20" />
            <Jimbot expression="celebrating" variant="standalone" size={240} className="relative max-h-[34vh] w-auto" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 max-w-[440px] font-display text-[32px] font-bold leading-[1.1] tracking-tight text-white md:text-[40px]">
            {title}
          </motion.h1>
          {chip && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-3">
              {chip}
            </motion.div>
          )}
          {body && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 max-w-[400px] text-[17px] font-semibold leading-snug text-ink">
              {body}
            </motion.p>
          )}
        </div>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 26 }}
          className="relative mx-auto w-full max-w-[480px] space-y-2 rounded-t-[32px] bg-surface px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 text-fg md:mb-8 md:rounded-[32px] md:shadow-float xl:mb-0"
        >
          {actions}
        </motion.div>
      </div>
      {aside && <div className="relative hidden w-[440px] shrink-0 xl:block">{aside}</div>}
    </main>
  )
}
