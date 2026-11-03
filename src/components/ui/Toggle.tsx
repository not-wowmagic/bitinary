import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-11 w-[58px] shrink-0 items-center', className)}
    >
      <span
        className={cn(
          'absolute inset-x-0 top-1/2 h-[31px] -translate-y-1/2 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-line dark:bg-elevated',
        )}
      />
      <motion.span
        className="relative ml-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)]"
        animate={{ x: checked ? 27 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
      />
    </button>
  )
}
