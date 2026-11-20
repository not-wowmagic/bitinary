import { MapPin } from 'lucide-react'
import type { JimbotPlaceDisplay } from '@/data/chat'

type Props = JimbotPlaceDisplay & {
  businessId: string
  time?: string | null
  note?: string | null
  estCost?: number | null
  onOpen?: (businessId: string) => void
}

export function PlaceStopCard({ businessId, name, city, time, note, estCost, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(businessId)}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:bg-sunken"
    >
      <MapPin size={16} className="mt-0.5 shrink-0 text-link" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {time ? `${time} · ` : ''}{name?.trim() || 'Verified place'}
        </span>
        {(city || note) && <span className="block text-xs text-fg-2">{[city, note].filter(Boolean).join(' · ')}</span>}
      </span>
      {estCost != null && <span className="shrink-0 text-xs text-fg-2">₱{estCost.toLocaleString()}</span>}
    </button>
  )
}
