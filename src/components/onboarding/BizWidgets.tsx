import { Check, Clock, Copy, Hand, ImageOff, MapPin, Plus, Search, Trash2, TriangleAlert, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { DAYS, type BusinessProfile, type Day, type DayHours, type MenuItem } from '@/app/account'
import { useLang } from '@/app/i18n'
import { bizTypeOpts, dayLabel, label } from '@/data/themes'
import { cn } from '@/lib/cn'
import { inputBase } from '../flow/Fields'
import { MapArt } from '../map/MapArt'
import { Jimbot } from '../mascot/Jimbot'

/* ------------------------------ Map pin dropper ------------------------------ */

export function MapPinDropper({ value, onChange, error }: { value?: { x: number; y: number }; onChange: (p: { x: number; y: number }) => void; error?: boolean }) {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pos = value ?? { x: 50, y: 50 }
  const place = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    onChange({ x: Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(94, Math.max(8, ((e.clientY - r.top) / r.height) * 100)) })
  }
  return (
    <div>
      <div
        ref={box}
        onPointerDown={(e) => {
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          setDragging(true)
          place(e)
        }}
        onPointerMove={(e) => dragging && place(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        role="application"
        aria-label={t('Mapa: i-drag ang pin sa eksaktong puwesto', 'Map: drag the pin to the exact spot')}
        className={cn('relative h-[230px] touch-none select-none overflow-hidden rounded-[20px] border-2', error ? 'border-danger' : 'border-line', dragging ? 'cursor-grabbing' : 'cursor-crosshair')}
      >
        <svg viewBox="380 200 640 460" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <MapArt />
        </svg>
        <motion.div className="pointer-events-none absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} animate={{ scale: dragging ? 1.15 : 1, y: dragging ? -8 : 0 }}>
          <div className="-translate-x-1/2 -translate-y-full">
            <MapPin size={44} strokeWidth={1.75} className={cn('drop-shadow-[0_6px_6px_rgba(43,19,10,.35)]', value ? 'fill-primary text-ink' : 'fill-cream text-fg-2')} />
          </div>
          <span className="absolute left-0 top-0 h-2.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-ink/30 blur-[1px]" />
        </motion.div>
        {!value && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-surface/95 px-3 py-2 text-[13px] font-semibold text-fg shadow-card dark:bg-elevated/95">
            <Hand size={16} className="text-link" /> {t('I-drag o i-tap para ilagay ang pin', 'Drag or tap to place the pin')}
          </div>
        )}
        {value && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-1 font-display text-[12px] font-semibold text-ok">
            <Check size={13} strokeWidth={3} /> {t('Nailagay na ang pin', 'Pin placed')}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Searchable city list ------------------------------ */

export function CitySearch({ value, onChange, options, error, id }: { value: string; onChange: (v: string) => void; options: string[]; error?: boolean; id?: string }) {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const list = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
  if (value && !open)
    return (
      <button type="button" onClick={() => (setOpen(true), setQ(''))} className={cn(inputBase, 'flex items-center justify-between border-primary/60 text-left')}>
        <span className="flex items-center gap-2">
          <MapPin size={18} className="text-link" /> {value}
        </span>
        <span className="font-display text-[14px] font-medium text-link">{t('Palitan', 'Change')}</span>
      </button>
    )
  return (
    <div className="relative">
      <Search size={18} className="pointer-events-none absolute left-4 top-[19px] text-fg-2" />
      <input
        id={id}
        role="combobox"
        aria-expanded={list.length > 0}
        aria-invalid={error}
        value={q}
        autoFocus={open}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('Hanapin ang lungsod o probinsya', 'Search city or province')}
        className={cn(inputBase, 'pl-11', error ? 'border-danger' : 'border-line')}
      />
      {(q || open) && (
        <ul role="listbox" className="mt-2 overflow-hidden rounded-[16px] border border-line bg-surface dark:bg-elevated">
          {list.length ? (
            list.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o === value}
                  onClick={() => {
                    onChange(o)
                    setQ('')
                    setOpen(false)
                  }}
                  className="flex h-12 w-full items-center gap-2 border-b border-line px-4 text-left text-[15px] last:border-0 hover:bg-sunken"
                >
                  <MapPin size={16} className="text-muted" /> {o}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-[14px] text-fg-2">{t('Walang tugma. Subukan ang ibang spelling.', 'No match. Try another spelling.')}</li>
          )}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------ Hours picker ------------------------------ */

function TogglePill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className={cn('h-9 rounded-full border px-3 font-display text-[13px] font-medium transition-colors', on ? 'border-brown bg-brown text-cream dark:border-cream dark:bg-cream dark:text-brown' : 'border-line bg-surface text-fg-2 dark:bg-elevated')}>
      {children}
    </button>
  )
}

const timeInput = 'h-10 min-w-0 flex-1 max-w-[150px] rounded-[12px] border border-line bg-surface px-2 text-[15px] text-fg outline-none focus:border-primary dark:bg-elevated'

export function HoursPicker({ value, onChange }: { value: Record<Day, DayHours>; onChange: (v: Record<Day, DayHours>) => void }) {
  const { lang, t } = useLang()
  const set = (d: Day, patch: Partial<DayHours>) => onChange({ ...value, [d]: { ...value[d], ...patch } })
  return (
    <div>
      <button
        type="button"
        onClick={() => onChange(Object.fromEntries(DAYS.map((d) => [d, { ...value.mon }])) as Record<Day, DayHours>)}
        className="mb-3 inline-flex h-10 items-center gap-2 rounded-full bg-sunken px-4 font-display text-[14px] font-medium text-link dark:bg-elevated"
      >
        <Copy size={16} /> {t('Kopyahin ang Lunes sa lahat ng araw', 'Copy Monday to all days')}
      </button>
      <ul className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface shadow-card dark:bg-elevated/40">
        {DAYS.map((d) => {
          const h = value[d]
          return (
            <li key={d} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[15px] font-semibold">{dayLabel[d][lang === 'en' ? 1 : 0]}</span>
                <div className="flex gap-1.5">
                  <TogglePill on={h.allDay} onClick={() => set(d, { allDay: !h.allDay, closed: false })}>
                    {t('24 oras', '24 hrs')}
                  </TogglePill>
                  <TogglePill on={h.closed} onClick={() => set(d, { closed: !h.closed, allDay: false })}>
                    {t('Sarado', 'Closed')}
                  </TogglePill>
                </div>
              </div>
              <div className="mt-2 flex min-h-10 items-center gap-2">
                {h.closed ? (
                  <span className="text-[14px] font-semibold text-fg-2">{t('Sarado buong araw', 'Closed all day')}</span>
                ) : h.allDay ? (
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ok">
                    <Clock size={15} /> {t('Bukas 24 oras', 'Open 24 hours')}
                  </span>
                ) : (
                  <>
                    <input type="time" aria-label={t(`Bukas ${dayLabel[d][0]}`, `Opens ${dayLabel[d][1]}`)} value={h.open} onChange={(e) => set(d, { open: e.target.value })} className={timeInput} />
                    <span className="text-fg-2">{t('hanggang', 'to')}</span>
                    <input type="time" aria-label={t(`Sarado ${dayLabel[d][0]}`, `Closes ${dayLabel[d][1]}`)} value={h.close} onChange={(e) => set(d, { close: e.target.value })} className={timeInput} />
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------ Repeatable menu row ------------------------------ */

export function MenuRows({ items, onChange, categories, errors }: { items: MenuItem[]; onChange: (v: MenuItem[]) => void; categories: string[]; errors?: Record<string, string> }) {
  const { t } = useLang()
  const set = (id: string, patch: Partial<MenuItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  return (
    <div className="space-y-2.5">
      {items.map((it, n) => (
        <motion.div key={it.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-[18px] border bg-surface p-3 dark:bg-elevated/40', errors?.[it.id] ? 'border-danger' : 'border-line')}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken font-display text-[12px] font-semibold text-fg-2 dark:bg-elevated">{n + 1}</span>
            <input value={it.name} onChange={(e) => set(it.id, { name: e.target.value })} aria-label={t('Pangalan ng item', 'Item name')} placeholder={t('hal. Sisig', 'e.g. Sisig')} className="h-11 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-3 text-[15px] outline-none focus:border-primary" />
            <button type="button" onClick={() => onChange(items.filter((i) => i.id !== it.id))} aria-label={t('Tanggalin', 'Remove')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fg-2 hover:bg-danger-bg hover:text-danger">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="mt-2 flex gap-2 pl-9">
            <div className="relative w-[120px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-display text-[15px] font-semibold text-fg-2">₱</span>
              <input value={it.price} inputMode="decimal" onChange={(e) => set(it.id, { price: e.target.value.replace(/[^\d.]/g, '') })} aria-label={t('Presyo', 'Price')} placeholder="0" className="h-11 w-full rounded-[12px] border border-line bg-bg pl-7 pr-2 text-[15px] outline-none focus:border-primary" />
            </div>
            <select value={it.category} onChange={(e) => set(it.id, { category: e.target.value })} aria-label={t('Kategorya', 'Category')} className="h-11 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-2 text-[15px] outline-none focus:border-primary">
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {errors?.[it.id] && <p className="mt-1.5 pl-9 text-[13px] font-semibold text-danger">{errors[it.id]}</p>}
        </motion.div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { id: `m${Date.now()}`, name: '', price: '', category: categories[0] }])}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-primary/50 font-display text-[15px] font-medium text-link"
      >
        <Plus size={18} /> {t('Magdagdag ng item', 'Add item')}
      </button>
    </div>
  )
}

/* ------------------------------ Go-live preview card ------------------------------ */

const fmt12 = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`
}
export function todayHours(b: BusinessProfile, lang: 'tl' | 'en') {
  const d = DAYS[(new Date().getDay() + 6) % 7]
  const h = b.hours[d]
  if (h.closed) return lang === 'en' ? 'Closed today' : 'Sarado ngayon'
  if (h.allDay) return lang === 'en' ? 'Open 24 hours' : 'Bukas 24 oras'
  return `${lang === 'en' ? 'Today' : 'Ngayon'} ${fmt12(h.open)}–${fmt12(h.close)}`
}

export function GoLivePreviewCard({ b, verified, className }: { b: BusinessProfile; verified?: boolean; className?: string }) {
  const { lang, t } = useLang()
  const type = label(bizTypeOpts, b.type, lang) ?? t('Negosyo', 'Business')
  return (
    <article className={cn('overflow-hidden rounded-[24px] bg-surface text-fg shadow-float dark:bg-elevated', className)} aria-label={t('Preview ng shop', 'Shop preview')}>
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        {b.cover ? (
          <img src={b.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#FFE1C4,#FFF1E3_60%)]">
            <Jimbot expression="pointing" variant="standalone" size={150} animate={false} />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-brown">
              <ImageOff size={12} /> {t('Default na larawan', 'Default photo')}
            </span>
          </div>
        )}
        <span className={cn('absolute left-3 top-3 inline-flex h-7 items-center gap-1 rounded-full px-2.5 font-display text-[12px] font-semibold', verified ? 'bg-ok text-white' : 'bg-white/92 text-caution')}>
          {verified ? <Check size={13} strokeWidth={3} /> : <TriangleAlert size={13} />}
          {verified ? t('Verified', 'Verified') : t('Hindi pa verified', 'Not yet verified')}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-[20px] font-semibold leading-tight">{b.name || t('Pangalan ng negosyo', 'Business name')}</h3>
        <p className="mt-1 text-[14px] text-fg-2">
          {type} · <span className="font-semibold text-fg">{b.price ?? '₱'}</span> · {b.city || t('Lungsod', 'City')}
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-1 font-display text-[13px] font-semibold text-ok">
          <Clock size={14} /> {todayHours(b, lang)}
        </p>
        {b.about && <p className="mt-3 line-clamp-2 text-[14px] leading-snug text-fg-2">{b.about}</p>}
        {b.menu.filter((m) => m.name).length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3">
            {b.menu
              .filter((m) => m.name)
              .slice(0, 3)
              .map((m) => (
                <li key={m.id} className="flex justify-between text-[14px]">
                  <span>{m.name}</span>
                  <span className="font-display font-semibold">{m.price ? `₱${m.price}` : '—'}</span>
                </li>
              ))}
          </ul>
        )}
        {b.address && <p className="mt-3 flex items-start gap-1.5 text-[13px] text-fg-2"><MapPin size={14} className="mt-0.5 shrink-0" /> {b.address}</p>}
      </div>
    </article>
  )
}

export function DismissX({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-sunken">
      <X size={18} />
    </button>
  )
}
