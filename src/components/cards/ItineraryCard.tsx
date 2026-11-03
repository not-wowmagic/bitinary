import { MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { stopsTotal, type Itinerary } from '@/data/itineraries'
import { cn } from '@/lib/cn'
import { img, peso } from '@/lib/format'
import { useOpen } from '@/lib/useOpen'
import { Jimbot } from '../mascot/Jimbot'
import { Button } from '../ui/Button'

export function ItineraryCard({ it, className }: { it: Itinerary; className?: string }) {
  const open = useOpen()
  const total = stopsTotal(it.stops)
  const places = it.stops.filter((s) => s.kind !== 'Transport').length
  return (
    <motion.article
      whileTap={{ scale: 0.97 }}
      onClick={() => open.itinerary(it.id)}
      className={cn('card w-[300px] shrink-0 cursor-pointer snap-start overflow-hidden md:w-auto', className)}
    >
      <div className="relative h-[110px]">
        <img src={img(it.image, 640, 240)} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
          <Jimbot crop="head" size={34} animate={false} />
          <span className="font-display text-[12px] font-semibold text-white">Pinili ni Jimbot</span>
        </div>
      </div>
      <div className="space-y-2 p-3.5">
        <div>
          <h3 className="text-h3">{it.title}</h3>
          <p className="text-caption text-fg-2">{it.subtitle}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-caption text-fg-2">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} strokeWidth={1.75} /> {places} hinto
            </span>
            <span>
              Tantya <b className="font-display font-semibold text-fg">{peso(total)}</b>
            </span>
          </div>
          <Button size="sm" onClick={(e) => (e.stopPropagation(), open.itinerary(it.id))}>
            Tingnan
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
