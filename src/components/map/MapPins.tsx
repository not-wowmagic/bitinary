import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export function UserDot({ x, y, radius = 60 }: { x: number; y: number; radius?: number }) {
  return (
    <div className="pointer-events-none absolute h-0 w-0" style={{ left: x, top: y }} aria-label="Pangkalahatang lugar mo">
      <span className="absolute rounded-full bg-primary/15 ring-1 ring-primary/30" style={{ width: radius * 2, height: radius * 2, left: -radius, top: -radius }} />
      <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-primary/50 [animation:pulse-ring_1.8s_ease-out_infinite]" />
      <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-[3px] border-white bg-primary shadow-md" />
    </div>
  )
}

export function PhotoPin({
  x,
  y,
  count,
  src,
  selected,
  onClick,
  label,
}: {
  x: number
  y: number
  count: number
  src?: string
  selected?: boolean
  onClick?: () => void
  label: string
}) {
  const size = selected ? 60 : 46
  return (
    <motion.button
      data-map-ui
      layout
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.9 }}
      className="absolute z-10"
      style={{ left: x, top: y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
    >
      <span
        className={cn(
          'block h-full w-full overflow-hidden rounded-full border-[3px] bg-primary shadow-[0_6px_14px_-4px_rgba(58,26,14,0.55)]',
          selected ? 'border-primary ring-[4px] ring-brown dark:ring-cream' : 'border-primary',
        )}
      >
        {src ? <img src={src} alt="" className="h-full w-full object-cover" draggable={false} /> : null}
      </span>
      {count > 1 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brown px-1.5 font-display text-[12px] font-semibold text-cream ring-2 ring-white dark:bg-cream dark:text-ink dark:ring-[#1A0D07]">
          {count}
        </span>
      )}
      <span className="absolute left-1/2 top-full -mt-0.5 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-primary" aria-hidden />
    </motion.button>
  )
}
