import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '@/app/store'
import { Jimbot } from '../mascot/Jimbot'

export function Toast() {
  const { toast, dismissToast } = useStore()
  const navigate = useNavigate()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismissToast, toast.action ? 4200 : 2800)
    return () => clearTimeout(t)
  }, [toast, dismissToast])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            className="glass pointer-events-auto flex max-w-[420px] items-center gap-3 rounded-[22px] py-2 pl-2 pr-3 shadow-float"
            role="status"
          >
            <Jimbot crop="head" size={40} expression={toast.expression ?? 'celebrating'} animate={false} />
            <p className="font-display text-[14px] font-medium text-fg">{toast.text}</p>
            {toast.action && (
              <button
                onClick={() => {
                  navigate(toast.action!.to)
                  dismissToast()
                }}
                className="ml-1 h-9 shrink-0 rounded-full bg-primary px-3 font-display text-[13px] font-medium text-ink"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
