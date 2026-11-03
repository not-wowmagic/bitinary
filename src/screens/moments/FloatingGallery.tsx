import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { animate, motion, useMotionValue, type PanInfo } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Polaroid, PolaroidSkeleton } from '@/components/cards/Polaroid'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import type { Moment } from '@/data/moments'
import { cn } from '@/lib/cn'

export type Snap = 'closed' | 'peek' | 'half' | 'full'
export type GalleryFilter = 'all' | 'mine' | 'trips'

type Props = {
  title: string
  moments: Moment[]
  filter: GalleryFilter
  setFilter: (f: GalleryFilter) => void
  loading?: boolean
  onOpen: (m: Moment) => void
}

function Header({ title, count, compact }: { title: string; count: number; compact?: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between gap-3 px-4">
      <div className="min-w-0">
        <h2 className={cn('truncate font-display font-semibold leading-tight', compact ? 'text-[18px]' : 'text-[20px]')}>{title}</h2>
        <p className="text-caption text-fg-2">{count} larawan sa nakikitang mapa</p>
      </div>
      <Button size="sm" className="!px-3 text-[13px]" icon={<Plus size={15} />} onClick={() => navigate('/moments/create')}>
        Gumawa ng Moment
      </Button>
    </div>
  )
}

function Filters({ filter, setFilter }: Pick<Props, 'filter' | 'setFilter'>) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
      {([
        ['all', 'Lahat'],
        ['mine', 'Akin'],
        ['trips', 'Mga Trip'],
      ] as const).map(([v, l]) => (
        <Chip key={v} active={filter === v} onClick={() => setFilter(v)}>
          {l}
        </Chip>
      ))}
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center px-6 py-4 text-center">
      <Jimbot expression="sleeping" variant="standalone" size={90} />
      <p className="mt-2 text-body text-fg-2">Walang larawan sa bahaging ito ng mapa. I-drag ang mapa o kunan ang una!</p>
    </div>
  )
}

function Row({ moments, loading, onOpen }: Pick<Props, 'moments' | 'loading' | 'onOpen'>) {
  if (loading)
    return (
      <div className="flex gap-4 overflow-hidden px-5 py-3">
        {[-3, 2, -2].map((t, i) => (
          <PolaroidSkeleton key={i} width={140} tilt={t} />
        ))}
      </div>
    )
  if (!moments.length) return <Empty />
  return (
    <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-4 pt-3">
      {moments.map((m) => (
        <div key={m.id} className="snap-start">
          <Polaroid src={m.src} caption={m.caption} date={m.date} frame={m.frame} tilt={m.tilt} width={140} onClick={() => onOpen(m)} />
        </div>
      ))}
    </div>
  )
}

function Masonry({ moments, loading, onOpen, cols = 2 }: Pick<Props, 'moments' | 'loading' | 'onOpen'> & { cols?: number }) {
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-4 px-4 py-3">
        {[-2, 3, 2, -3].map((t, i) => (
          <PolaroidSkeleton key={i} width="100%" tilt={t} />
        ))}
      </div>
    )
  if (!moments.length) return <Empty />
  // manual masonry: distribute into columns (more robust than CSS multi-column)
  const columns: Moment[][] = Array.from({ length: cols }, () => [])
  moments.forEach((m, i) => columns[i % cols].push(m))
  return (
    <div className="flex gap-4 px-4 pb-6 pt-2">
      {columns.map((col, ci) => (
        <div key={ci} className={cn('flex min-w-0 flex-1 flex-col gap-5', ci % 2 === 1 && 'pt-6')}>
          {col.map((m) => (
            <Polaroid key={m.id} src={m.src} caption={m.caption} date={m.date} frame={m.frame} tilt={m.tilt * 0.7} width="100%" onClick={() => onOpen(m)} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Mobile: floating glass bottom sheet with peek / half / full snap heights. */
export function GallerySheet({ snap, setSnap, containerH, bottomOffset, ...p }: Props & { snap: Snap; setSnap: (s: Snap) => void; containerH: number; bottomOffset: number }) {
  const heights: Record<Snap, number> = {
    closed: 0,
    peek: 112,
    half: 372,
    full: Math.max(420, containerH - bottomOffset - 120),
  }
  const h = useMotionValue(heights[snap])
  const startH = useRef(0)

  useEffect(() => {
    const ctrl = animate(h, heights[snap], { type: 'spring', stiffness: 380, damping: 38 })
    return () => ctrl.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, containerH])

  const onPanEnd = (_: unknown, info: PanInfo) => {
    const projected = h.get() - info.velocity.y * 0.18
    if (projected < heights.peek * 0.55) return setSnap('closed')
    const order: Snap[] = ['peek', 'half', 'full']
    const best = order.reduce((a, b) => (Math.abs(heights[b] - projected) < Math.abs(heights[a] - projected) ? b : a))
    setSnap(best)
    animate(h, heights[best], { type: 'spring', stiffness: 380, damping: 38 })
  }

  if (snap === 'closed') return null

  return (
    <motion.section
      data-map-ui
      aria-label="Gallery ng Moments"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ height: h, bottom: bottomOffset }}
      className="glass absolute inset-x-2 z-30 flex flex-col overflow-hidden rounded-[28px] shadow-float"
    >
      <motion.div
        onPanStart={() => (startH.current = h.get())}
        onPan={(_, info) => h.set(Math.max(60, Math.min(heights.full + 30, startH.current - info.offset.y)))}
        onPanEnd={onPanEnd}
        onTap={() => snap === 'peek' && setSnap('half')}
        className="shrink-0 cursor-grab touch-none pb-2 pt-2 active:cursor-grabbing"
      >
        <div className="mx-auto mb-2 h-[5px] w-10 rounded-full bg-fg/25" />
        <Header title={p.title} count={p.moments.length} compact={snap === 'peek'} />
      </motion.div>
      {snap !== 'peek' && (
        <>
          <div className="shrink-0 pb-1">
            <Filters filter={p.filter} setFilter={p.setFilter} />
          </div>
          <div className={cn('min-h-0 flex-1', snap === 'full' ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden')}>
            {snap === 'half' ? <Row {...p} /> : <Masonry {...p} />}
          </div>
        </>
      )}
    </motion.section>
  )
}

/** Tablet / desktop: floating docked panel with collapse button. */
export function GalleryDock({ collapsed, setCollapsed, ...p }: Props & { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  if (collapsed) {
    return (
      <button
        data-map-ui
        onClick={() => setCollapsed(false)}
        className="glass absolute right-4 top-4 z-30 flex h-12 items-center gap-2 rounded-full pl-4 pr-3 font-display text-[14px] font-semibold shadow-float"
      >
        {p.title} · {p.moments.length} larawan <ChevronDown size={18} />
      </button>
    )
  }
  return (
    <section data-map-ui aria-label="Gallery ng Moments" className="glass absolute bottom-4 right-4 top-4 z-30 flex w-[360px] flex-col overflow-hidden rounded-[28px] shadow-float">
      <div className="flex shrink-0 items-start gap-2 pb-3 pt-4">
        <div className="min-w-0 flex-1">
          <Header title={p.title} count={p.moments.length} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 pb-2 pr-3">
        <div className="min-w-0 flex-1">
          <Filters filter={p.filter} setFilter={p.setFilter} />
        </div>
        <button onClick={() => setCollapsed(true)} aria-label="I-collapse ang gallery" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-fg-2 dark:bg-elevated">
          <ChevronUp size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Masonry {...p} />
      </div>
    </section>
  )
}
