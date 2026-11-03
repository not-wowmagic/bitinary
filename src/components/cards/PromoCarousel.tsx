import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useAccount } from '@/app/account'
import { useBanners, useTrackView, type Banner, type Viewer } from '@/app/console'
import { useOpen } from '@/lib/useOpen'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/cn'
import { src } from '@/lib/media'
import { Tag } from 'lucide-react'

const tones = {
  orange: { bg: 'bg-primary', title: 'text-white', sub: 'text-ink', cta: 'bg-ink text-cream', tag: 'bg-white/25 text-ink' },
  brown: { bg: 'bg-brown dark:bg-elevated', title: 'text-cream', sub: 'text-[#F2D3BD]', cta: 'bg-primary text-ink', tag: 'bg-white/15 text-cream' },
  amber: { bg: 'bg-amber', title: 'text-ink', sub: 'text-ink', cta: 'bg-ink text-cream', tag: 'bg-ink/10 text-ink' },
}

/** Who is looking, for banner audiences. */
export function useViewer(): Viewer {
  const { session } = useAccount()
  return !session || session.kind === 'guest' ? 'guests' : session.role === 'business' ? 'business' : 'travelers'
}

/** Opens a banner's link (place, app route or website) and counts the click. */
export function useBannerOpen(onClick?: (id: string) => void) {
  const open = useOpen()
  const navigate = useNavigate()
  return (b: Banner) => {
    onClick?.(b.id)
    if (b.link.kind === 'place') open.place(b.link.placeId)
    else if (b.link.kind === 'route') navigate(b.link.path)
    else window.open(b.link.url, '_blank', 'noopener')
  }
}

/** Image-only slide: the picture fills the carousel box exactly (cover crop around the focus point). */
function ImageSlide({ banner, onClick, onError }: { banner: Banner; onClick: () => void; onError: () => void }) {
  const f = banner.focus ?? { x: 50, y: 50 }
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={`Promo: ${banner.alt || banner.title}`}
      className="relative block h-[168px] w-full shrink-0 snap-center overflow-hidden rounded-[20px] bg-sunken text-left dark:bg-elevated"
    >
      <img src={src(banner.image!, 1600)} alt={banner.alt || banner.title} onError={onError} decoding="async" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${f.x}% ${f.y}%` }} />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/35 to-transparent" aria-hidden />
      <span className="absolute left-3 top-3 inline-flex h-6 items-center gap-1 rounded-full bg-black/45 px-2 font-display text-[11px] font-semibold text-white backdrop-blur-sm">
        <Tag size={12} strokeWidth={2} /> PROMO{banner.label ? ` · ${banner.label}` : ''}
      </span>
    </motion.button>
  )
}

export function PromoBanner({ banner, onClick }: { banner: Banner; onClick?: () => void }) {
  const t = tones[banner.tone]
  const go = useBannerOpen()
  const [broken, setBroken] = useState(false)
  if (banner.style === 'image' && banner.image && !broken) return <ImageSlide banner={banner} onClick={onClick ?? (() => go(banner))} onError={() => setBroken(true)} />
  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      onClick={onClick ?? (() => go(banner))}
      className={cn('relative flex h-[168px] w-full shrink-0 cursor-pointer snap-center overflow-hidden rounded-[20px]', t.bg)}
      aria-label={`Promo: ${banner.title}`}
    >
      <div className="relative z-10 flex w-[62%] flex-col justify-between p-4 pr-0">
        <div className="space-y-1.5">
          <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2 font-display text-[11px] font-semibold', t.tag)}>
            <Tag size={12} strokeWidth={2} /> PROMO{banner.label ? ` · ${banner.label}` : ''}
          </span>
          <h3 className={cn('line-clamp-2 font-display text-[21px] font-bold leading-[1.15]', t.title)}>{banner.title}</h3>
          <p className={cn('line-clamp-1 text-[13px] font-semibold', t.sub)}>{banner.subtitle}</p>
        </div>
        <span className={cn('inline-flex h-9 w-fit items-center rounded-full px-4 font-display text-[13px] font-semibold', t.cta)}>{banner.cta}</span>
      </div>
      {banner.image && (
        <div className="absolute -right-6 top-1/2 h-[210px] w-[210px] -translate-y-1/2 overflow-hidden rounded-full border-[6px] border-white/25">
          <img src={src(banner.image, 420, 420)} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
    </motion.article>
  )
}

function CarouselItem({ banner, onClick, track }: { banner: Banner; onClick: () => void; track: (id: string, k: 'views') => void }) {
  useTrackView(banner.id, track)
  return <PromoBanner banner={banner} onClick={onClick} />
}

export function PromoCarousel() {
  const { list: promos, trackClick, trackView } = useBanners('home-carousel', useViewer())
  const go = useBannerOpen(trackClick)
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    const id = setInterval(() => {
      if (paused.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % promos.length
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, 5000)
    return () => {
      el.removeEventListener('scroll', onScroll)
      clearInterval(id)
    }
  }, [promos.length])

  if (!promos.length) return null
  return (
    <div
      className="px-4 md:px-0"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
    >
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[20px]" aria-roledescription="carousel">
        {promos.map((p) => (
          <div key={p.id} className="w-full shrink-0 snap-center pr-0">
            <CarouselItem banner={p} onClick={() => go(p)} track={trackView} />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" role="tablist" aria-label="Promo">
        {promos.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={i === index}
            aria-label={`Promo ${i + 1}`}
            onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' })}
            className="flex h-6 items-center"
          >
            <span className={cn('block h-2 rounded-full transition-all', i === index ? 'w-6 bg-primary' : 'w-2 bg-muted/50')} />
          </button>
        ))}
      </div>
    </div>
  )
}
