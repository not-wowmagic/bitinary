import { ChevronRight, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { BizLogo } from '@/components/profile/Bits'
import { LINKED_PLACE_ID, places, type Place } from '@/data/places'
import { cn } from '@/lib/cn'
import { img } from '@/lib/format'

/** Business profiles, the one linked to Bitinary Business first. */
export const businessesFirst = (list: Place[] = places) => [...list.filter((p) => p.id === LINKED_PLACE_ID), ...list.filter((p) => p.id !== LINKED_PLACE_ID)]

/** Facebook-page style card that always opens the full business profile. */
export function BusinessCard({ place, className }: { place: Place; className?: string }) {
  const navigate = useNavigate()
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/shop/${place.id}`)}
      className={cn('group flex w-full flex-col overflow-hidden rounded-[22px] bg-surface text-left shadow-card', className)}
      aria-label={`Profile ng ${place.name}`}
    >
      <div className="relative h-24 overflow-hidden">
        <img src={img(place.image, 600, 240)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
      </div>
      <div className="relative px-3.5 pb-3.5">
        <BizLogo place={place} size={52} className="-mt-7 ring-[3px] ring-surface" />
        <p className="mt-2 truncate font-display text-[16px] font-semibold leading-tight">{place.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-fg-2">
          <Star size={13} className="text-amber" fill="currentColor" strokeWidth={0} />
          <b className="font-display text-fg">{place.rating}</b> · {place.reviews.toLocaleString()} review
        </p>
        <p className="truncate text-[13px] text-fg-2">
          {place.category} · {place.area}
        </p>
        <span className="mt-2.5 inline-flex h-9 items-center gap-1 rounded-full bg-primary/12 px-3 font-display text-[13px] font-medium text-link">
          Tingnan ang profile <ChevronRight size={15} />
        </span>
      </div>
    </motion.button>
  )
}
