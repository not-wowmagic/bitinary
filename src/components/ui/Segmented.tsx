import { motion } from 'motion/react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  tone = 'default',
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
  tone?: 'default' | 'glass' | 'dark'
  label?: string
}) {
  const id = useId()
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'relative inline-flex h-10 items-center rounded-full p-1',
        tone === 'default' && 'bg-sunken dark:bg-elevated',
        tone === 'glass' && 'glass shadow-float',
        tone === 'dark' && 'glass-dark',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-10 h-8 flex-1 rounded-full px-4 font-display text-[14px] font-medium transition-colors',
              active ? 'text-on-primary' : tone === 'dark' ? 'text-white/85' : 'text-fg-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
