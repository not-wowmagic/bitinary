import { BadgeCheck, Play } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useStore } from '@/app/store'
import { placeById } from '@/data/places'
import type { Reel } from '@/data/reels'
import { cn } from '@/lib/cn'
import { compact, img } from '@/lib/format'
import { NewTag, SponsoredTag } from '../ui/Pill'

export function BizLogo({ placeId, size = 24, className }: { placeId: string; size?: number; className?: string }) {
  const p = placeById(placeId)!
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ring-2 ring-white/80', className)}
      style={{ width: size, height: size, background: p.logo.color, fontSize: size * 0.38 }}
      aria-hidden
    >
      {p.logo.initials}
    </span>
  )
}

/** Moving preview: real clip when provided, otherwise a slow Ken Burns pan over the poster. */
export function ReelMedia({ reel, playing, className }: { reel: Reel; playing: boolean; className?: string }) {
  if (reel.video && playing) {
    return (
      <video src={reel.video} poster={img(reel.poster, 600, 1066)} muted loop playsInline autoPlay className={cn('h-full w-full object-cover', className)} />
    )
  }
  return (
    <img
      src={img(reel.poster, 600, 1066)}
      alt=""
      className={cn('h-full w-full object-cover', playing && 'kenburns', className)}
      loading="lazy"
    />
  )
}

export function ReelCard({ reel, featured }: { reel: Reel; featured?: boolean }) {
  const navigate = useNavigate()
  const { dataSaver } = useStore()
  const place = placeById(reel.placeId)!
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/reels/${reel.id}`)}
      aria-label={`Reel ng ${place.name}, ${compact(reel.views)} views`}
      className={cn(
        'relative shrink-0 snap-start overflow-hidden rounded-[20px] bg-ink text-left',
        featured ? 'h-[300px] w-[169px]' : 'h-[250px] w-[140px]',
      )}
    >
      <ReelMedia reel={reel} playing={!dataSaver} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-1">
        {featured && reel.isNew ? <NewTag /> : reel.sponsored ? <SponsoredTag /> : <span />}
        <span className="glass-dark flex h-7 w-7 items-center justify-center rounded-full">
          <Play size={13} fill="white" strokeWidth={0} className="ml-0.5 text-white" />
        </span>
      </div>
      <div className="absolute inset-x-2 bottom-2 space-y-1.5">
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 py-1 pl-1 pr-2 backdrop-blur-md">
          <BizLogo placeId={place.id} size={22} />
          <span className="truncate font-display text-[12px] font-semibold text-white">{place.name}</span>
          <BadgeCheck size={14} className="shrink-0 text-[#7BE09A]" strokeWidth={2.2} aria-label="Verified" />
        </div>
        <div className="flex items-center gap-1 pl-1 font-display text-[12px] font-semibold text-white">
          <Play size={11} fill="white" strokeWidth={0} /> {compact(reel.views)}
        </div>
      </div>
    </motion.button>
  )
}
