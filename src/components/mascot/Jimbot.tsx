import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import appIcon from '@/assets/jimbot/app-icon.png'
import celebrate from '@/assets/jimbot/celebrate.png'
import directions from '@/assets/jimbot/directions.png'
import hello from '@/assets/jimbot/hello.png'
import idea from '@/assets/jimbot/idea.png'
import { cn } from '@/lib/cn'
import { useReducedMotion } from '@/lib/useMedia'

/**
 * Jimbot mascot. The four official poses are the supplied artwork, used unaltered:
 *   waving = "Hello", pointing = "Directions", idea = "Idea", celebrating = "Celebrate".
 * thinking / unsure / sleeping / camera are TEMPORARY composites (official art + flat props drawn
 * in the same outline style) and are to be replaced by final artwork.
 */
export type Expression = 'waving' | 'pointing' | 'idea' | 'celebrating' | 'thinking' | 'unsure' | 'sleeping' | 'camera'

export const expressions: Expression[] = ['waving', 'pointing', 'idea', 'celebrating', 'thinking', 'unsure', 'sleeping', 'camera']
export const officialExpressions: Expression[] = ['waving', 'pointing', 'idea', 'celebrating']

export const expressionLabel: Record<Expression, string> = {
  waving: 'Hello',
  pointing: 'Directions',
  idea: 'Idea',
  celebrating: 'Celebrate',
  thinking: 'Thinking',
  unsure: 'Unsure',
  sleeping: 'Offline',
  camera: 'Camera',
}

const INK = '#2A1B14'
const CREAM = '#FFF8EF'
const BROWN = '#6B3A22'

/** Props are drawn on the 500x500 artboard of the source PNGs. */
const placeholderProps: Partial<Record<Expression, ReactNode>> = {
  thinking: (
    <g>
      {[[54, 94, 38], [90, 64, 42], [130, 90, 34], [114, 130, 34], [64, 132, 32]].map(([x, y, r]) => (
        <circle key={`o${x}`} cx={x} cy={y} r={r + 7} fill={INK} />
      ))}
      {[[54, 94, 38], [90, 64, 42], [130, 90, 34], [114, 130, 34], [64, 132, 32]].map(([x, y, r]) => (
        <circle key={`i${x}`} cx={x} cy={y} r={r} fill={CREAM} />
      ))}
      {[66, 92, 118].map((x) => (
        <circle key={x} cx={x} cy={102} r={8} fill={BROWN} />
      ))}
      <circle cx={158} cy={178} r={13} fill={CREAM} stroke={INK} strokeWidth={6} />
      <circle cx={178} cy={204} r={8} fill={CREAM} stroke={INK} strokeWidth={5} />
    </g>
  ),
  unsure: (
    <g>
      <circle cx={52} cy={248} r={46} fill={CREAM} stroke={INK} strokeWidth={7} />
      <text x={52} y={272} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={70} fill="#FF6A00" stroke={INK} strokeWidth={3} paintOrder="stroke">
        ?
      </text>
    </g>
  ),
  sleeping: (
    <g fontFamily="Poppins, sans-serif" fontWeight={700} fill="#8FA6C9" stroke={INK} strokeWidth={4} paintOrder="stroke">
      <text x={418} y={196} fontSize={60}>Z</text>
      <text x={452} y={146} fontSize={42}>z</text>
      <text x={474} y={110} fontSize={30}>z</text>
    </g>
  ),
  camera: (
    <g strokeLinejoin="round">
      <rect x={66} y={262} width={64} height={30} rx={10} fill={BROWN} stroke={INK} strokeWidth={7} />
      <rect x={22} y={280} width={150} height={104} rx={24} fill={BROWN} stroke={INK} strokeWidth={8} />
      <rect x={22} y={306} width={150} height={16} fill="#FF6A00" />
      <circle cx={97} cy={334} r={36} fill={CREAM} stroke={INK} strokeWidth={7} />
      <circle cx={97} cy={334} r={20} fill={INK} />
      <circle cx={105} cy={326} r={6} fill={CREAM} />
      <rect x={140} y={292} width={18} height={10} rx={4} fill="#FFD36B" stroke={INK} strokeWidth={4} />
    </g>
  ),
}

const artFor: Record<Expression, string> = {
  waving: hello,
  pointing: directions,
  idea,
  celebrating: celebrate,
  thinking: idea,
  unsure: directions,
  sleeping: celebrate,
  camera: hello,
}

export const isPlaceholder = (e: Expression) => !officialExpressions.includes(e)

type Props = {
  expression?: Expression
  /** badge: art on an orange disc. standalone: transparent art. */
  variant?: 'badge' | 'standalone'
  /** full: whole illustration. head: round face crop (chat avatar / notification badge). */
  crop?: 'full' | 'head'
  size?: number
  animate?: boolean
  className?: string
  title?: string
  /** squircle + head = app icon tile */
  shape?: 'circle' | 'squircle'
}

/* Face crop of the 500px artboard: center (250,230), radius 125. */
const FACE = { cx: 250, cy: 230, r: 125 }

export function Jimbot({ expression = 'waving', variant = 'badge', crop = 'full', size = 120, animate = true, className, title, shape = 'circle' }: Props) {
  const reduce = useReducedMotion()
  const live = animate && !reduce && crop === 'full'
  const label = title ?? `Jimbot · ${expressionLabel[expression]}${isPlaceholder(expression) ? ' (pansamantalang art)' : ''}`
  const src = artFor[expression]
  const props = placeholderProps[expression]

  if (crop === 'head' && shape === 'squircle') {
    return <img src={appIcon} alt={label} width={size} height={size} draggable={false} className={cn('shrink-0 select-none rounded-[22.5%]', className)} style={{ width: size, height: size }} />
  }

  if (crop === 'head') {
    const k = size / (FACE.r * 2)
    return (
      <span role="img" aria-label={label} className={cn('relative inline-block shrink-0 overflow-hidden rounded-full bg-primary', className)} style={{ width: size, height: size }}>
        <img src={src} alt="" draggable={false} className="absolute max-w-none select-none" style={{ width: 500 * k, height: 500 * k, left: -(FACE.cx - FACE.r) * k, top: -(FACE.cy - FACE.r) * k }} />
      </span>
    )
  }

  const motionProps = live
    ? expression === 'celebrating'
      ? { animate: { y: [0, -6, 0], rotate: [0, -2, 2, 0] }, transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' as const } }
      : expression === 'sleeping'
        ? { animate: { scale: [1, 1.015, 1] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } }
        : { animate: { y: [0, -4, 0] }, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const } }
    : {}

  return (
    <span
      role="img"
      aria-label={label}
      data-placeholder={isPlaceholder(expression) || undefined}
      className={cn('relative inline-block shrink-0', variant === 'badge' && 'overflow-hidden rounded-full bg-primary', className)}
      style={{ width: size, height: size }}
    >
      <motion.span className="absolute inset-0 block" style={variant === 'badge' ? { inset: '6% 4% 0' } : undefined} {...motionProps}>
        <img src={src} alt="" draggable={false} className={cn('h-full w-full select-none object-contain', expression === 'sleeping' && 'saturate-[.55] brightness-95')} />
        {props && (
          <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {props}
          </svg>
        )}
      </motion.span>
    </span>
  )
}

/** Round avatar from Image 1 (chat avatar 40px, notification badge 24px). */
export function JimbotAvatar({ size = 40, expression = 'waving', className }: { size?: 40 | 24 | number; expression?: Expression; className?: string }) {
  return <Jimbot crop="head" size={size} expression={expression} animate={false} className={className} />
}
