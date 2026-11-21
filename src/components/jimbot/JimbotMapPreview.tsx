import { MapPin } from 'lucide-react'
import { forwardRef } from 'react'
import type { JimbotMap } from '@/data/chat'
import { cn } from '@/lib/cn'

/** Pin list for the plan. Swap for MiniMap later. */
export const JimbotMapPreview = forwardRef<
  HTMLElement,
  {
    map: JimbotMap
    highlight?: boolean
    onOpenBusiness?: (id: string) => void
  }
>(function JimbotMapPreview({ map, highlight, onOpenBusiness }, ref) {
  const pins = map.pins ?? map.businessIds.map((businessId) => ({ businessId }))
  if (!pins.length) return null
  return (
    <section
      ref={ref}
      tabIndex={-1}
      className={cn(
        'space-y-2 rounded-2xl border border-line bg-bg p-3 outline-none transition-shadow',
        highlight && 'border-link shadow-[0_0_0_3px_rgba(37,99,235,0.25)]',
      )}
    >
      <p className="text-xs font-medium text-fg-2">Mga pin sa mapa · {pins.length}</p>
      <ul className="space-y-1 text-sm">
        {pins.map((p) => {
          const label = ('name' in p && (p.name as string | undefined)) || null
          return (
            <li key={p.businessId}>
              <button
                type="button"
                onClick={() => onOpenBusiness?.(p.businessId)}
                className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-surface"
              >
                <MapPin size={14} className="shrink-0 text-link" />
                <span className="truncate">{label ?? 'Verified place'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-fg-2">I-tap ang pin para buksan ang shop.</p>
    </section>
  )
})
