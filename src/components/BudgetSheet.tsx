import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useItineraryStops } from '@/app/store'
import type { StopKind } from '@/data/itineraries'
import { cn } from '@/lib/cn'
import { peso } from '@/lib/format'
import { Button } from './ui/Button'
import { Bar, Donut } from './ui/Charts'
import { Sheet } from './ui/Sheet'

const kinds: { k: StopKind; color: string }[] = [
  { k: 'Pagkain', color: '#FF6A00' },
  { k: 'Transport', color: '#6B3A22' },
  { k: 'Aktibidad', color: '#FFB400' },
  { k: 'Iba pa', color: '#B08A74' },
]

export function BudgetSheet({ open, onClose, itineraryId = 'it1' }: { open: boolean; onClose: () => void; itineraryId?: string }) {
  const stops = useItineraryStops(itineraryId)
  const [planned, setPlanned] = useState<Record<StopKind, number>>({ Pagkain: 700, Transport: 300, Aktibidad: 400, 'Iba pa': 100 })
  const est = Object.fromEntries(kinds.map(({ k }) => [k, stops.filter((s) => s.kind === k).reduce((a, s) => a + s.cost, 0)])) as Record<StopKind, number>
  const totalPlanned = Object.values(planned).reduce((a, b) => a + b, 0)
  const totalEst = Object.values(est).reduce((a, b) => a + b, 0)
  const max = Math.max(...kinds.map(({ k }) => Math.max(planned[k], est[k]))) * 1.15

  return (
    <Sheet open={open} onClose={onClose} title="Budget maker" footer={<Button block onClick={onClose}>Tapos na</Button>}>
      <div className="flex items-center gap-4">
        <Donut segments={kinds.map(({ k, color }) => ({ label: k, value: est[k], color }))} size={136} stroke={20}>
          <span className="text-[12px] text-fg-2">Tantya</span>
          <span className="font-display text-[20px] font-bold">{peso(totalEst)}</span>
        </Donut>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="rounded-2xl bg-sunken p-3 dark:bg-elevated">
            <p className="text-[12px] text-fg-2">Planado</p>
            <p className="font-display text-[20px] font-bold">{peso(totalPlanned)}</p>
          </div>
          <p className={cn('px-1 text-[14px] font-semibold', totalEst <= totalPlanned ? 'text-ok' : 'text-danger')}>
            {totalEst <= totalPlanned ? `Pasok! Tipid ka ng ${peso(totalPlanned - totalEst)}` : `Lampas ng ${peso(totalEst - totalPlanned)}`}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {kinds.map(({ k, color }) => (
          <li key={k}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-display text-[15px] font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ background: color }} /> {k}
              </span>
              <div className="flex items-center gap-1">
                <Step label={`Bawasan ang ${k}`} onClick={() => setPlanned((p) => ({ ...p, [k]: Math.max(0, p[k] - 50) }))}>
                  <Minus size={16} />
                </Step>
                <span className="w-16 text-center font-display text-[14px] font-semibold">{peso(planned[k])}</span>
                <Step label={`Dagdagan ang ${k}`} onClick={() => setPlanned((p) => ({ ...p, [k]: p[k] + 50 }))}>
                  <Plus size={16} />
                </Step>
              </div>
            </div>
            <Bar value={est[k]} max={max} color={color} planned={planned[k]} />
            <p className="mt-1 text-caption text-fg-2">
              Tantya {peso(est[k])} · planado {peso(planned[k])}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-caption text-fg-2">Ang guhit sa bar ay ang planado mong halaga.</p>
    </Sheet>
  )
}

function Step({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button aria-label={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-fg dark:bg-elevated">
      {children}
    </button>
  )
}
