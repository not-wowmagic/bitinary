import { motion } from 'motion/react'
import type { MomentFrame } from '@/data/moments'
import { cn } from '@/lib/cn'
import { shortDate } from '@/lib/format'

export const frameStyles: Record<MomentFrame, { bg: string; ink: string; label: string }> = {
  classic: { bg: '#FFFFFF', ink: '#3A1A0E', label: 'Classic white' },
  cream: { bg: '#FFF1E3', ink: '#3A1A0E', label: 'Cream' },
  orange: { bg: '#FF6A00', ink: '#2B130A', label: 'Orange' },
  brown: { bg: '#3A1A0E', ink: '#FFF1E3', label: 'Brown' },
  film: { bg: '#141414', ink: '#F5F5F5', label: 'Film-strip' },
}

export function Polaroid({
  src,
  caption,
  date,
  place,
  frame = 'classic',
  tilt = 0,
  width = 160,
  className,
  onClick,
  developing,
}: {
  src: string
  caption?: string
  date?: string
  place?: string
  frame?: MomentFrame
  tilt?: number
  width?: number | string
  className?: string
  onClick?: () => void
  developing?: boolean
}) {
  const f = frameStyles[frame]
  const isFilm = frame === 'film'
  return (
    <motion.figure
      onClick={onClick}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      style={{ rotate: tilt, width, background: f.bg }}
      className={cn(
        'relative shrink-0 p-[6%] pb-0 [container-type:inline-size] shadow-[0_10px_24px_-8px_rgba(58,26,14,0.45),0_1px_2px_rgba(0,0,0,0.12)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {isFilm && (
        <>
          <div className="absolute inset-x-[6%] top-[1.5%] flex justify-between" aria-hidden>
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="h-[3px] w-[8%] rounded-[1px] bg-white/70" />
            ))}
          </div>
        </>
      )}
      <div className="relative aspect-square overflow-hidden bg-[#2a2a2a]">
        <motion.img
          src={src}
          alt={caption ?? 'Moment'}
          className="h-full w-full object-cover"
          initial={developing ? { opacity: 0.15, filter: 'sepia(1) blur(6px) brightness(1.6) contrast(0.6)' } : false}
          animate={{ opacity: 1, filter: 'sepia(0) blur(0px) brightness(1) contrast(1)' }}
          transition={{ duration: developing ? 2 : 0, ease: 'easeOut' }}
          draggable={false}
        />
      </div>
      <figcaption className="flex min-h-[24%] flex-col justify-center px-[2%] py-[5%]" style={{ color: f.ink }}>
        {caption && <span className="line-clamp-1 font-hand text-[clamp(13px,10.5cqw,26px)] leading-tight">{caption}</span>}
        {(date || place) && (
          <span className="line-clamp-1 font-hand text-[clamp(11px,7.5cqw,17px)] leading-tight opacity-75">
            {[date && shortDate(date), place].filter(Boolean).join(' · ')}
          </span>
        )}
      </figcaption>
    </motion.figure>
  )
}

export function PolaroidSkeleton({ width = 150, tilt = 0 }: { width?: number | string; tilt?: number }) {
  return (
    <div style={{ width, rotate: `${tilt}deg` }} className="shrink-0 bg-surface p-[6%] pb-[22%] shadow-card dark:bg-elevated">
      <div className="skeleton aspect-square rounded-none" />
    </div>
  )
}
