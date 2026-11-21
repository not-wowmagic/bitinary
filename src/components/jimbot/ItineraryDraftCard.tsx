import type { JimbotItineraryDraft } from '@/data/chat'
import { PlaceStopCard } from './PlaceStopCard'

export function ItineraryDraftCard({ draft, onOpenBusiness }: { draft: JimbotItineraryDraft; onOpenBusiness?: (id: string) => void }) {
  const days = Array.isArray(draft?.days) ? draft.days.filter((d) => Array.isArray(d?.stops) && d.stops.length > 0) : []
  if (!days.length) return null

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-bg p-3">
      <header>
        <h3 className="font-display text-[15px] font-semibold">{draft.title}</h3>
        {draft.area && <p className="text-xs text-fg-2">{draft.area}</p>}
      </header>
      {days.map((d) => (
        <div key={d.day} className="space-y-2">
          <p className="text-xs font-medium text-fg-2">Day {d.day}</p>
          {d.stops.map((s, i) => (
            <PlaceStopCard key={`${s.businessId}-${i}`} {...s} onOpen={onOpenBusiness} />
          ))}
        </div>
      ))}
    </section>
  )
}
