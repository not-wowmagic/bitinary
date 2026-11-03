import { CloudCheck, GripVertical, Pencil, Plus, Save, Share, Sparkles, Trash2 } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAccount } from '@/app/account'
import { useItineraryStops, useStore } from '@/app/store'
import { BackButton } from '@/components/layout/TopBar'
import { Jimbot } from '@/components/mascot/Jimbot'
import { ShareSheet, shareOrFallback } from '@/components/ShareSheet'
import { StateView } from '@/components/states/States'
import { Button, IconButton } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/Charts'
import { CautionPill, ClosingPill, Pill, VerifiedPill } from '@/components/ui/Pill'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { Sheet } from '@/components/ui/Sheet'
import { itineraryById, stopsTotal, type Stop } from '@/data/itineraries'
import { placeById } from '@/data/places'
import { cn } from '@/lib/cn'
import { peso } from '@/lib/format'
import { useOpen } from '@/lib/useOpen'

export function ItineraryScreen() {
  const { id = '' } = useParams()
  return <ItineraryView id={id} />
}

export function ItineraryView({ id, embedded }: { id: string; embedded?: boolean }) {
  const it = itineraryById(id)
  const stops = useItineraryStops(id)
  const { setItineraryStops, saveItinerary, savedItineraries, showToast } = useStore()
  const [editing, setEditing] = useState(false)
  const [editStop, setEditStop] = useState<Stop | null>(null)
  const [share, setShare] = useState(false)
  const navigate = useNavigate()
  const open = useOpen()
  const { requireAccount } = useAccount()

  if (!it) {
    return <StateView expression="unsure" title="Walang ganitong itinerary" body="Baka nabura na ito." action="Bumalik" onAction={() => navigate('/')} />
  }

  const spent = stopsTotal(stops)
  const remaining = it.budget - spent
  const over = remaining < 0
  const saved = savedItineraries.includes(id)

  const reorder = (next: Stop[]) => {
    // times belong to slots, so the schedule stays chronological
    const times = stops.map((s) => s.time)
    setItineraryStops(id, next.map((s, i) => ({ ...s, time: times[i] })))
  }

  return (
    <main className={cn('pb-32', !embedded && 'md:pb-12')}>
      {/* sticky budget header */}
      <div className={cn('sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-xl', embedded ? 'pr-14' : '')}>
        <div className={cn('mx-auto px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))]', !embedded && 'max-w-[760px] md:px-6 md:pt-6')}>
          <div className="flex items-center gap-2">
            {!embedded && <BackButton />}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-caption text-fg-2">
                <Jimbot crop="head" size={20} animate={false} /> Itinerary ni Jimbot <PhaseTag phase="MVP" />
              </p>
              <h1 className="truncate text-h2">{it.title}</h1>
            </div>
            <IconButton label={editing ? 'Tapos na' : 'I-edit'} variant="glass" onClick={() => setEditing((e) => !e)} className={editing ? '!bg-primary !text-ink' : ''}>
              <Pencil size={19} />
            </IconButton>
            <IconButton label="I-share" variant="glass" onClick={() => shareOrFallback({ title: it.title, text: `Itinerary ko sa Bitinary: ${it.title}` }, () => setShare(true))}>
              <Share size={19} />
            </IconButton>
          </div>
          <div className="mt-3 flex items-center gap-4 rounded-[20px] bg-surface p-3 shadow-card">
            <ProgressRing value={spent / it.budget} size={68} stroke={8} color={over ? 'var(--c-danger)' : 'var(--c-primary)'}>
              <span className="font-display text-[15px] font-bold">{Math.round((spent / it.budget) * 100)}%</span>
            </ProgressRing>
            <dl className="grid flex-1 grid-cols-3 gap-2">
              <Stat label="Budget" value={peso(it.budget)} />
              <Stat label="Tantya" value={peso(spent)} />
              <Stat label={over ? 'Sobra' : 'Natitira'} value={peso(Math.abs(remaining))} tone={over ? 'danger' : 'ok'} />
            </dl>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Pill kind="verified" size="sm" icon={<CloudCheck size={13} />}>
              Available offline
            </Pill>
            <span className="text-caption text-fg-2">{stops.length} hinto · {it.area}</span>
          </div>
        </div>
      </div>

      <div className={cn('mx-auto px-4 pt-4', !embedded && 'max-w-[760px] md:px-6')}>
        {editing && (
          <p className="mb-3 rounded-2xl bg-caution-bg px-3 py-2 text-[14px] font-semibold text-caution">
            I-drag ang hawakan para ayusin ang pagkakasunod-sunod. I-tap ang hinto para baguhin.
          </p>
        )}
        <Reorder.Group axis="y" values={stops} onReorder={reorder} className="relative space-y-3">
          <span className="absolute bottom-6 left-[31px] top-6 w-[2px] rounded-full bg-line" aria-hidden />
          {stops.map((s) => (
            <TimelineRow
              key={s.id}
              stop={s}
              editing={editing}
              onOpen={() => (editing ? setEditStop(s) : s.placeId && open.place(s.placeId))}
            />
          ))}
        </Reorder.Group>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Button variant="secondary" icon={<Plus size={18} />} onClick={() => navigate('/search')}>
            Magdagdag
          </Button>
          <Button variant="secondary" icon={<Sparkles size={18} />} onClick={open.jimbot}>
            Kay Jimbot
          </Button>
        </div>
        <Button
          block
          size="lg"
          className="mt-3"
          icon={<Save size={20} />}
          onClick={() => {
            if (!requireAccount('Para ma-save ang trip mo.')) return
            saveItinerary(id)
            setEditing(false)
            showToast({ text: saved ? 'Na-update ang itinerary!' : 'Na-save! Makikita mo ito kahit offline.', expression: 'celebrating' })
          }}
        >
          {saved ? 'I-save ang pagbabago' : 'I-save ang itinerary'}
        </Button>
        <p className="mt-3 text-center text-caption text-fg-2">Ang lahat ng gastos ay tantya batay sa huling verified na presyo.</p>
      </div>

      <EditStopSheet
        stop={editStop}
        onClose={() => setEditStop(null)}
        onSave={(st) => setItineraryStops(id, stops.map((x) => (x.id === st.id ? st : x)))}
        onDelete={(st) => setItineraryStops(id, stops.filter((x) => x.id !== st.id))}
      />
      <ShareSheet open={share} onClose={() => setShare(false)} title={it.title} />
    </main>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'danger' }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[12px] text-fg-2">{label}</dt>
      <dd className={cn('font-display text-[16px] font-bold leading-tight', tone === 'ok' && 'text-ok', tone === 'danger' && 'text-danger')}>{value}</dd>
    </div>
  )
}

function TimelineRow({ stop, editing, onOpen }: { stop: Stop; editing: boolean; onOpen: () => void }) {
  const controls = useDragControls()
  const place = stop.placeId ? placeById(stop.placeId) : undefined
  const [time, ampm] = stop.time.includes(' ') && /AM|PM/.test(stop.time) ? stop.time.split(' ') : [stop.time, '']
  return (
    <Reorder.Item value={stop} dragListener={false} dragControls={controls} className="relative flex items-stretch gap-3" whileDrag={{ scale: 1.02, zIndex: 10 }}>
      <div className="relative z-10 flex w-[64px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-primary px-1 py-2 text-ink">
        <span className="text-center font-display text-[15px] font-bold leading-none">{time}</span>
        {ampm && <span className="mt-0.5 font-display text-[11px] font-semibold">{ampm}</span>}
      </div>
      <div className="card flex min-w-0 flex-1 items-center gap-2 p-3">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="text-caption text-fg-2">{stop.kind}</p>
          <p className="truncate font-display text-[16px] font-semibold">{stop.name}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {place ? <VerifiedPill days={place.verifiedDays} size="sm" /> : <CautionPill>Tantya lang</CautionPill>}
            {place?.status === 'closingSoon' && <ClosingPill size="sm" at={place.closesAt} />}
          </div>
        </button>
        <div className="shrink-0 text-right">
          <p className="font-display text-[16px] font-bold">{peso(stop.cost)}</p>
          <p className="font-display text-[10px] font-semibold tracking-[0.12em] text-fg-2">TANTYA</p>
        </div>
        <button
          aria-label={`Ilipat ang ${stop.name}`}
          onPointerDown={(e) => controls.start(e)}
          className={cn('-mr-1 flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted active:cursor-grabbing', !editing && 'opacity-60')}
        >
          <GripVertical size={20} />
        </button>
      </div>
    </Reorder.Item>
  )
}

function EditStopSheet({ stop, onClose, onSave, onDelete }: { stop: Stop | null; onClose: () => void; onSave: (s: Stop) => void; onDelete: (s: Stop) => void }) {
  const [draft, setDraft] = useState<Stop | null>(null)
  const s = draft?.id === stop?.id ? draft : stop
  return (
    <Sheet open={!!stop} onClose={onClose} title="Baguhin ang hinto">
      {s && (
        <div className="space-y-4">
          <p className="font-display text-[17px] font-semibold">{s.name}</p>
          <label className="block">
            <span className="text-caption text-fg-2">Oras</span>
            <input
              value={s.time}
              onChange={(e) => setDraft({ ...s, time: e.target.value })}
              className="mt-1 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-body outline-none focus:border-primary dark:bg-elevated"
            />
          </label>
          <label className="block">
            <span className="text-caption text-fg-2">Tantyang gastos (₱)</span>
            <input
              type="number"
              inputMode="numeric"
              value={s.cost}
              onChange={(e) => setDraft({ ...s, cost: Number(e.target.value) || 0 })}
              className="mt-1 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-body outline-none focus:border-primary dark:bg-elevated"
            />
          </label>
          <div className="flex gap-2">
            <Button variant="danger" icon={<Trash2 size={18} />} onClick={() => (onDelete(s), onClose())}>
              Alisin
            </Button>
            <Button block onClick={() => (onSave(s), onClose())}>
              I-save
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
