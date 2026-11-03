import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

/** iOS-style system alert. */
export function IOSAlert({
  open,
  title,
  message,
  actions,
  stacked,
  children,
}: {
  open: boolean
  title: string
  message?: ReactNode
  actions: { label: string; onClick: () => void; bold?: boolean; destructive?: boolean }[]
  stacked?: boolean
  children?: ReactNode
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            className="w-[270px] overflow-hidden rounded-[14px] bg-[rgba(242,242,247,0.92)] text-center text-black backdrop-blur-2xl dark:bg-[rgba(44,44,46,0.92)] dark:text-white"
          >
            <div className="px-4 pb-4 pt-5">
              <p className="text-[17px] font-semibold leading-snug [font-family:-apple-system,system-ui,sans-serif]">{title}</p>
              {message && <div className="mt-1 text-[13px] leading-snug [font-family:-apple-system,system-ui,sans-serif]">{message}</div>}
              {children}
            </div>
            <div className={cn('border-t border-black/15 dark:border-white/15', stacked ? 'flex flex-col' : 'grid grid-cols-2')}>
              {actions.map((a, i) => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className={cn(
                    'h-11 text-[17px] text-[#007AFF] [font-family:-apple-system,system-ui,sans-serif] active:bg-black/5 dark:text-[#0A84FF]',
                    a.bold && 'font-semibold',
                    a.destructive && 'text-[#FF3B30]',
                    i > 0 && (stacked ? 'border-t border-black/15 dark:border-white/15' : 'border-l border-black/15 dark:border-white/15'),
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
