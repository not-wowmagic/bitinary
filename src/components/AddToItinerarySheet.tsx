import { CalendarPlus, Check } from 'lucide-react'
import { useAccount } from '@/app/account'
import { useStore } from '@/app/store'
import { itineraries, stopsTotal } from '@/data/itineraries'
import type { Place } from '@/data/places'
import { peso } from '@/lib/format'
import { Sheet } from './ui/Sheet'

export function AddToItinerarySheet({ place, open, onClose }: { place: Place; open: boolean; onClose: () => void }) {
  const { addStop, itineraryStops, showToast } = useStore()
  const { requireAccount } = useAccount()
  const cost = place.menu[0]?.price ?? 0
  return (
    <Sheet open={open} onClose={onClose} title="Idagdag sa itinerary">
      <p className="mb-3 text-body text-fg-2">
        Saan mo idadagdag ang <b className="text-fg">{place.name}</b>? Tantyang gastos: {peso(cost)}.
      </p>
      <ul className="space-y-2">
        {itineraries.map((it) => {
          const stops = itineraryStops[it.id] ?? it.stops
          const already = stops.some((s) => s.placeId === place.id)
          return (
            <li key={it.id}>
              <button
                disabled={already}
                onClick={() => {
                  if (!requireAccount('Para maidagdag ito sa trip mo.')) return onClose()
                  addStop(it.id, {
                    id: `${place.id}-${Date.now()}`,
                    time: '5:00 PM',
                    name: place.name,
                    placeId: place.id,
                    kind: place.category === 'Pasyalan' || place.category === 'Tours' ? 'Aktibidad' : place.category === 'Pasalubong' ? 'Iba pa' : 'Pagkain',
                    cost,
                  })
                  onClose()
                  showToast({ text: `Naidagdag sa "${it.title}"`, expression: 'celebrating', action: { label: 'Tingnan', to: `/itinerary/${it.id}` } })
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-sunken p-3 text-left disabled:opacity-60 dark:bg-elevated"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-ink">
                  {already ? <Check size={20} /> : <CalendarPlus size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[15px] font-semibold">{it.title}</span>
                  <span className="block text-caption text-fg-2">
                    {already ? 'Nandito na' : `${stops.length} hinto · ${peso(stopsTotal(stops))}`}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
