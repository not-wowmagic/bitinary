import { ChevronRight, Megaphone } from 'lucide-react'
import { motion } from 'motion/react'
import { useBanners, useTrackView, type Banner, type Placement, type Viewer } from '@/app/console'
import { placeById } from '@/data/places'
import { cn } from '@/lib/cn'
import { img } from '@/lib/format'
import { src } from '@/lib/media'
import { Button } from '../ui/Button'
import { SponsoredTag, VerifiedPill } from '../ui/Pill'
import { useBannerOpen, useViewer } from './PromoCarousel'

/** The n-th live banner of a placement, with view/click tracking. Renders nothing when there is none. */
function useSlot(placement: Placement, slot: number, viewer?: Viewer) {
  const current = useViewer()
  const { list, trackClick, trackView } = useBanners(placement, viewer ?? current)
  const b = list[slot - 1]
  useTrackView(b?.id, trackView)
  const go = useBannerOpen(trackClick)
  return { b, go }
}

const imageOf = (b: Banner) => (b.image ? src(b.image, 400, 400) : b.link.kind === 'place' ? img(placeById(b.link.placeId)?.image ?? '', 400, 400) : undefined)

export function SponsoredView({ banner, onClick }: { banner: Banner; onClick?: () => void }) {
  const place = banner.link.kind === 'place' ? placeById(banner.link.placeId) : undefined
  const image = imageOf(banner)
  return (
    <motion.article whileTap={{ scale: 0.98 }} onClick={onClick} className="card mx-4 flex cursor-pointer gap-3 overflow-hidden p-2.5 md:mx-0" aria-label={`Sponsored: ${banner.title}`}>
      {image && (
        <div className="relative w-[38%] shrink-0 overflow-hidden rounded-[14px]">
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex min-h-[132px] min-w-0 flex-1 flex-col gap-1.5 py-1 pr-1">
        <div className="flex items-center gap-1.5">
          <SponsoredTag />
          <span className="truncate text-caption text-fg-2">{place?.name ?? banner.sponsor}</span>
        </div>
        <h3 className="line-clamp-2 text-h3 leading-snug">{banner.title}</h3>
        <p className="line-clamp-2 text-caption text-fg-2">{banner.subtitle}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          {place ? <VerifiedPill days={place.verifiedDays} size="sm" /> : <span />}
          <Button size="sm" variant="secondary" className="text-link">
            {banner.cta}
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

/** Home sponsored slot (1 or 2). */
export function SponsoredCard({ slot }: { slot: number }) {
  const { b, go } = useSlot('home-sponsored', slot)
  return b ? <SponsoredView banner={b} onClick={() => go(b)} /> : null
}

/** Compact sponsored row for search results. */
export function SearchAdView({ banner, onClick }: { banner: Banner; onClick?: () => void }) {
  const image = imageOf(banner)
  return (
    <button onClick={onClick} className="card flex w-full items-center gap-3 p-2.5 text-left" aria-label={`Sponsored: ${banner.title}`}>
      {image && <img src={image} alt="" className="h-16 w-16 shrink-0 rounded-[14px] object-cover" loading="lazy" />}
      <span className="min-w-0 flex-1">
        <SponsoredTag />
        <span className="mt-1 block truncate font-display text-[16px] font-semibold">{banner.title}</span>
        <span className="block truncate text-caption text-fg-2">{banner.subtitle}</span>
      </span>
      <span className="hidden shrink-0 rounded-full bg-primary px-3 py-2 font-display text-[13px] font-medium text-ink sm:block">{banner.cta}</span>
      <ChevronRight size={18} className="shrink-0 text-muted sm:hidden" />
    </button>
  )
}
export function SearchAd() {
  const { b, go } = useSlot('search', 1)
  return b ? <SearchAdView banner={b} onClick={() => go(b)} /> : null
}

const stripTone = { orange: 'bg-primary text-ink', brown: 'bg-brown text-cream dark:bg-elevated', amber: 'bg-amber text-ink' }

/** Slim banner, used on business profiles and as the /biz announcement strip. */
export function StripView({ banner, onClick, className }: { banner: Banner; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left', stripTone[banner.tone], className)}>
      {banner.image ? <img src={src(banner.image, 120, 120)} alt="" className="h-10 w-10 shrink-0 rounded-[12px] object-cover" /> : <Megaphone size={20} className="shrink-0" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold">{banner.title}</span>
        {banner.subtitle && <span className="block truncate text-[13px] opacity-85">{banner.subtitle}</span>}
      </span>
      <span className="shrink-0 rounded-full bg-black/10 px-3 py-1.5 font-display text-[13px] font-medium dark:bg-white/10">{banner.cta}</span>
    </button>
  )
}
/** Profile banner; never shows a sponsor's ad on another business's profile. */
export function ProfileStrip({ placeId }: { placeId: string }) {
  const { list, trackClick, trackView } = useBanners('profile', useViewer())
  const b = list.find((x) => x.link.kind !== 'place' || x.link.placeId === placeId || !x.sponsor || x.sponsor === placeId)
  useTrackView(b?.id, trackView)
  const go = useBannerOpen(trackClick)
  return b ? <StripView banner={b} onClick={() => go(b)} className="mt-3" /> : null
}
/** Announcement strip for business owners in /biz. Place links open the traveler profile. */
export function BizBar({ className }: { className?: string }) {
  const { b, go } = useSlot('biz-bar', 1, 'business')
  if (!b) return null
  const open = () => (b.link.kind === 'place' ? window.open(`${import.meta.env.BASE_URL}shop/${b.link.placeId}`, '_blank', 'noopener') : go(b))
  return <StripView banner={b} onClick={open} className={className} />
}
