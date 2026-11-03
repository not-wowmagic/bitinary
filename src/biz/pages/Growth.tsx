import { CalendarCheck, Check, Clock3, Gift, MapPin, Percent, Printer, QrCode, RefreshCw, Rocket, Tag, Ticket, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { inputBase } from '@/components/flow/Fields'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { longDate, num, time12 } from '../format'
import { stats, type Boost, type Deal, type DealKind } from '../seed'
import { useBiz } from '../store'
import { Card, LockedFeature, Pill } from '../ui'
import { SubPage } from './Account'

const field = cn(inputBase, 'border-line')

/* ------------------------------ QR kit ------------------------------ */

/** Decorative QR-style code generated from the token (sample only, not scannable). */
export function SampleQR({ token, size = 160 }: { token: string; size?: number }) {
  const n = 25
  let h = [...token].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296)
  const finder = (x: number, y: number) => x < 7 && y < 7
  const isF = (x: number, y: number) => finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y)
  const cells: [number, number][] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!isF(x, y) && rnd() > 0.52) cells.push([x, y])
  const F = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={7} height={7} rx={1.6} fill="#2B130A" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} fill="#2B130A" />
    </g>
  )
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label={`QR ${token}`} className="rounded-[10px] bg-white">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#2B130A" />
      ))}
      <F x={0} y={0} />
      <F x={n - 7} y={0} />
      <F x={0} y={n - 7} />
    </svg>
  )
}

export function QrKit() {
  const { d, set, t, showToast } = useBiz()
  const [confirm, setConfirm] = useState(false)
  const today = stats.checkins[stats.checkins.length - 1]
  return (
    <SubPage
      title={t('QR Check-in kit', 'QR Check-in kit')}
      phase="MVP"
      actions={
        <Button icon={<Printer size={18} />} onClick={() => window.print()}>
          {t('I-print', 'Print')}
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_280px]">
        <Card title={t('Table tent (A5)', 'Table tent (A5)')}>
          <div className="mx-auto flex aspect-[3/4] max-w-[300px] flex-col items-center justify-between rounded-[18px] bg-primary p-5 text-center">
            <div className="flex items-center gap-2">
              <Jimbot expression="pointing" variant="standalone" size={64} animate={false} />
              <p className="font-display text-[18px] font-bold leading-tight text-white">
                {t('Mag-check in dito!', 'Check in here!')}
              </p>
            </div>
            <div className="rounded-[16px] bg-white p-2">
              <SampleQR token={d.qrToken} size={150} />
            </div>
            <div>
              <p className="font-display text-[17px] font-bold text-ink">{d.business.name}</p>
              <p className="text-[13px] font-semibold text-ink">Bitinary · {d.qrToken}</p>
            </div>
          </div>
        </Card>
        <Card title={t('Sticker sa counter (8 cm)', 'Counter sticker (8 cm)')}>
          <div className="mx-auto flex aspect-square max-w-[240px] flex-col items-center justify-center gap-2 rounded-full border-[6px] border-primary bg-cream p-5 text-center">
            <Jimbot crop="head" size={44} />
            <SampleQR token={d.qrToken} size={110} />
            <p className="font-display text-[13px] font-bold text-brown">{d.business.name}</p>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <p className="text-[15px] text-fg-2">{t('Check-ins ngayong araw', "Today's check-ins")}</p>
            <p className="font-display text-[40px] font-bold leading-none">{today}</p>
            <p className="mt-1 text-[14px] text-fg-2">{t('Ang bawat check-in ay nagbibigay ng "Na-verify na bisita" sa review.', 'Each check-in gives reviews a "Verified visit" pill.')}</p>
          </Card>
          <Card>
            <p className="font-display text-[15px] font-semibold">QR code</p>
            <p className="font-mono text-[15px]">{d.qrToken}</p>
            <Button variant="secondary" className="mt-3" icon={<RefreshCw size={17} />} onClick={() => setConfirm(true)}>
              {t('Gumawa ng bagong QR', 'Regenerate QR')}
            </Button>
            <p className="mt-2 text-[13px] text-fg-2">{t('Sample na QR ito sa prototype.', 'This is a sample QR in the prototype.')}</p>
          </Card>
        </div>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t('Gumawa ng bagong QR?', 'Regenerate QR?')}>
        <p className="text-body text-fg-2">{t('Hindi na gagana ang lumang QR. Kailangang i-print ulit ang kit.', 'The old QR will stop working. You will need to reprint the kit.')}</p>
        <Button block size="lg" className="mt-4" onClick={() => (set((x) => ({ ...x, qrToken: `KMB-${Math.random().toString(16).slice(2, 6).toUpperCase()}` })), setConfirm(false), showToast({ text: t('Bagong QR, handa nang i-print', 'New QR ready to print') }))}>
          {t('Gumawa ng bago', 'Regenerate')}
        </Button>
      </Sheet>
    </SubPage>
  )
}

/* ------------------------------ Deals ------------------------------ */

export function DealCard({ deal, className }: { deal: Pick<Deal, 'kind' | 'item' | 'percent' | 'minSpend' | 'addon' | 'from' | 'to' | 'start' | 'end' | 'code' | 'redemption'>; className?: string }) {
  const { t, lang, d } = useBiz()
  const title = deal.kind === 'b1t1' ? 'Buy 1 Take 1' : deal.kind === 'discount' ? `${deal.percent ?? 10}% off` : t(`Libreng ${deal.addon || 'add-on'}`, `Free ${deal.addon || 'add-on'}`)
  return (
    <div className={cn('relative overflow-hidden rounded-[22px] bg-brown p-5 text-cream dark:bg-elevated', className)}>
      <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/40" />
      <p className="font-display text-[13px] font-semibold uppercase tracking-wide text-amber">{d.business.name}</p>
      <p className="mt-1 font-display text-[30px] font-bold leading-tight text-white">{title}</p>
      <p className="font-display text-[18px] font-semibold">{deal.item || t('Pumili ng item', 'Choose an item')}</p>
      {deal.kind === 'discount' && deal.minSpend ? <p className="text-[15px] text-[#E8CDB9]">{t(`Minimum na gastos ₱${deal.minSpend}`, `Minimum spend ₱${deal.minSpend}`)}</p> : null}
      <p className="mt-3 text-[15px] text-[#E8CDB9]">
        {longDate(deal.start, lang)} – {longDate(deal.end, lang)}
        <br />
        {deal.from}–{deal.to}
      </p>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 font-display text-[14px] font-bold text-brown">
        {deal.redemption === 'qr' ? <QrCode size={16} /> : <Ticket size={16} />} {deal.redemption === 'qr' ? 'QR' : deal.code}
      </p>
    </div>
  )
}

export function DealsPage() {
  const { d, set, t, lang, verified, showToast } = useBiz()
  const [params, setParams] = useSearchParams()
  const newKind = params.get('new') as DealKind | null
  const [open, setOpen] = useState(!!newKind)
  const [done, setDone] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState<Omit<Deal, 'id' | 'status' | 'redeemed' | 'views'>>({ kind: newKind ?? 'b1t1', item: 'Tapsilog', percent: 10, minSpend: 500, addon: 'Iced tea', start: today, end: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), from: '17:00', to: '20:00', limitPerDay: 30, limitTotal: 300, redemption: 'qr', code: 'BEN-B1T1' })
  if (!verified)
    return (
      <SubPage title="Deals" phase="P2">
        <LockedFeature title="Deals" />
      </SubPage>
    )
  const templates: [DealKind, string, string, React.ReactNode][] = [
    ['b1t1', 'Buy 1 Take 1', t('Pinakasikat tuwing Biyernes', 'Most popular on Fridays'), <Gift size={22} key="b" />],
    ['discount', t('Diskwento', 'Discount'), t('May minimum na gastos', 'With minimum spend'), <Percent size={22} key="p" />],
    ['addon', t('Libreng add-on', 'Free add-on'), t('hal. libreng iced tea', 'e.g. free iced tea'), <Tag size={22} key="a" />],
  ]
  const publish = () => {
    const deal: Deal = { ...f, id: `d${Date.now()}`, status: f.start > today ? 'scheduled' : 'active', redeemed: { qr: 0, code: 0 }, views: 0 }
    set((x) => ({ ...x, deals: [deal, ...x.deals] }))
    setDone(true)
  }
  return (
    <SubPage title="Deals" phase="P2" actions={<Button icon={<Tag size={18} />} onClick={() => setOpen(true)}>{t('Bagong deal', 'New deal')}</Button>}>
      <Card className="p-0 md:p-0">
        <ul className="divide-y divide-line">
          {d.deals.map((x) => (
            <li key={x.id} className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary/15 text-link">
                <Ticket size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px] font-semibold">
                  {x.kind === 'b1t1' ? 'Buy 1 Take 1' : x.kind === 'discount' ? `${x.percent}% off` : 'Free add-on'} · {x.item}
                </span>
                <span className="text-[14px] text-fg-2">
                  {longDate(x.start, lang)} – {longDate(x.end, lang)} · {x.from}–{x.to}
                </span>
              </span>
              <span className="text-right text-[14px]">
                <b className="block font-display text-[18px]">{x.redeemed.qr + x.redeemed.code}</b>
                <span className="text-fg-2">{t('Mga Dumating', 'Customers sent')}</span>
              </span>
              <Pill tone={x.status === 'active' ? 'ok' : x.status === 'scheduled' ? 'caution' : 'default'}>{x.status === 'active' ? t('Aktibo', 'Active') : x.status === 'scheduled' ? t('Naka-schedule', 'Scheduled') : t('Tapos na', 'Ended')}</Pill>
            </li>
          ))}
        </ul>
      </Card>
      <Sheet open={open} onClose={() => (setOpen(false), setDone(false), setParams({}, { replace: true }))} title={done ? undefined : t('Gumawa ng deal', 'Deal builder')} className="md:max-w-[880px]">
        {done ? (
          <div className="flex flex-col items-center text-center">
            <Jimbot expression="celebrating" variant="standalone" size={150} />
            <h2 className="mt-2 text-h2">{t('Na-publish ang deal!', 'Deal published!')}</h2>
            <p className="mt-1 text-body text-fg-2">{t('Lalabas ito sa profile mo at kay Jimbot.', 'It will show on your profile and in Jimbot.')}</p>
            <Button block size="lg" className="mt-5" onClick={() => (setOpen(false), setDone(false))}>
              {t('Tapos na', 'Done')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {templates.map(([k, n, s, ic]) => (
                  <button key={k} onClick={() => setF({ ...f, kind: k, code: k === 'b1t1' ? 'BEN-B1T1' : k === 'discount' ? 'BEN10' : 'BENFREE' })} aria-pressed={f.kind === k} className={cn('rounded-[16px] border-2 p-3 text-left', f.kind === k ? 'border-primary bg-primary/10' : 'border-line')}>
                    <span className="text-link">{ic}</span>
                    <span className="mt-1 block font-display text-[15px] font-semibold">{n}</span>
                    <span className="text-[13px] text-fg-2">{s}</span>
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="mb-1.5 block font-display text-[14px] font-medium">Item</span>
                <select value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} className={field}>
                  {d.business.menu.map((m) => (
                    <option key={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
              {f.kind === 'discount' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Diskwento (%)', 'Discount (%)')}</span>
                    <input type="number" min={5} max={50} value={f.percent} onChange={(e) => setF({ ...f, percent: Number(e.target.value) })} className={field} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Minimum na gastos (₱)', 'Minimum spend (₱)')}</span>
                    <input type="number" min={0} value={f.minSpend} onChange={(e) => setF({ ...f, minSpend: Number(e.target.value) })} className={field} />
                  </label>
                </div>
              )}
              {f.kind === 'addon' && (
                <label className="block">
                  <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Libreng add-on', 'Free add-on')}</span>
                  <input value={f.addon} onChange={(e) => setF({ ...f, addon: e.target.value })} className={field} />
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['start', t('Simula', 'Start date'), 'date'],
                    ['end', t('Dulo', 'End date'), 'date'],
                    ['from', t('Mula oras', 'From'), 'time'],
                    ['to', t('Hanggang oras', 'To'), 'time'],
                  ] as const
                ).map(([k, l, ty]) => (
                  <label key={k} className="block">
                    <span className="mb-1.5 block font-display text-[14px] font-medium">{l}</span>
                    <input type={ty} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={field} />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Limit bawat araw', 'Limit per day')}</span>
                  <input type="number" min={1} value={f.limitPerDay} onChange={(e) => setF({ ...f, limitPerDay: Number(e.target.value) })} className={field} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Kabuuang limit', 'Total limit')}</span>
                  <input type="number" min={1} value={f.limitTotal} onChange={(e) => setF({ ...f, limitTotal: Number(e.target.value) })} className={field} />
                </label>
              </div>
              <div>
                <p className="mb-1.5 font-display text-[14px] font-medium">{t('Paano ire-redeem', 'Redemption')}</p>
                <Segmented<'qr' | 'code'> className="w-full" value={f.redemption} onChange={(v) => setF({ ...f, redemption: v })} options={[{ value: 'qr', label: 'QR' }, { value: 'code', label: t('Code', 'Code') }]} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-display text-[14px] font-medium">Preview</p>
              <DealCard deal={f} />
              <Button block size="lg" onClick={publish}>
                {t('I-publish ang deal', 'Publish deal')}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </SubPage>
  )
}

/* ------------------------------ Boost ------------------------------ */

export function BoostPage() {
  const { d, set, t, verified, showToast } = useBiz()
  const [params] = useSearchParams()
  const published = d.posts.filter((p) => p.status === 'published')
  const [postId, setPostId] = useState(params.get('post') ?? published[0]?.id ?? '')
  const [budget, setBudget] = useState(500)
  const [days, setDays] = useState(3)
  const [target, setTarget] = useState<Boost['target']>('nearby2')
  if (!verified)
    return (
      <SubPage title={t('Mga boost', 'Boosts')} phase="P2">
        <LockedFeature title={t('Boosts', 'Boosts')} />
      </SubPage>
    )
  const mult = target === 'nearby2' ? 10 : target === 'nearby5' ? 14 : 12
  const reach = [Math.round(budget * mult * 0.8), Math.round(budget * mult * 1.25)]
  const pct = ((budget - 100) / 1900) * 100
  return (
    <SubPage title={t('Mga boost', 'Boosts')} phase="P2">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card title={t('Bagong boost', 'New boost')} icon={<Rocket size={20} />}>
          <div className="space-y-5">
            <div>
              <p className="mb-2 font-display text-[14px] font-medium">{t('Aling post', 'Which post')}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {published.map((p) => (
                  <button key={p.id} onClick={() => setPostId(p.id)} aria-pressed={postId === p.id} className={cn('flex items-center gap-2 rounded-[14px] border-2 p-2 text-left', postId === p.id ? 'border-primary bg-primary/10' : 'border-line')}>
                    <img src={p.media[0]} alt="" className="h-12 w-12 rounded-[10px] object-cover" />
                    <span className="line-clamp-2 text-[14px]">{p.title ?? p.text}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[14px] font-medium">Budget</span>
                <span className="font-display text-[28px] font-bold">₱{num(budget)}</span>
              </div>
              <input type="range" aria-label="Budget" min={100} max={2000} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-2 h-3 w-full cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, var(--c-primary) ${pct}%, var(--c-sunken) ${pct}%)` }} />
              <div className="mt-1 flex justify-between text-[13px] text-fg-2">
                <span>₱100</span>
                <span>₱2,000</span>
              </div>
            </div>
            <div>
              <p className="mb-2 font-display text-[14px] font-medium">{t('Tagal', 'Duration')}</p>
              <Segmented<string> className="w-full" value={String(days)} onChange={(v) => setDays(Number(v))} options={[{ value: '1', label: t('1 araw', '1 day') }, { value: '3', label: t('3 araw', '3 days') }, { value: '7', label: t('7 araw', '7 days') }]} />
            </div>
            <div>
              <p className="mb-2 font-display text-[14px] font-medium">Target</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ['nearby2', t('Malapit, 2 km', 'Nearby, 2 km'), <MapPin size={18} key="a" />],
                    ['nearby5', t('Malapit, 5 km', 'Nearby, 5 km'), <MapPin size={18} key="b" />],
                    ['searching', t('Naghahanap ng kainan', 'Searching for food'), <Users size={18} key="c" />],
                  ] as const
                ).map(([k, l, ic]) => (
                  <button key={k} onClick={() => setTarget(k)} aria-pressed={target === k} className={cn('flex min-h-14 items-center gap-2 rounded-[14px] border-2 px-3 text-left text-[15px]', target === k ? 'border-primary bg-primary/10' : 'border-line')}>
                    <span className="text-link">{ic}</span> {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <p className="text-[15px] text-fg-2">{t('Tantyang abot', 'Estimated reach')}</p>
            <p className="font-display text-[30px] font-bold">
              {num(reach[0])}–{num(reach[1])}
            </p>
            <p className="text-[14px] text-fg-2">{t(`sa loob ng ${days} araw`, `over ${days} days`)}</p>
            <Button block size="lg" className="mt-4" icon={<Rocket size={18} />} onClick={() => (set((x) => ({ ...x, boosts: [{ id: `b${Date.now()}`, postId, budget, days, target, status: 'active', start: new Date().toISOString(), results: { reach: 0, clicks: 0, saves: 0 } }, ...x.boosts] })), showToast({ text: t('Sinimulan ang boost!', 'Boost started!'), expression: 'celebrating' }))}>
              {t(`I-boost sa ₱${num(budget)}`, `Boost for ₱${num(budget)}`)}
            </Button>
          </Card>
          <Card title={t('Resulta', 'Results')}>
            <ul className="divide-y divide-line">
              {d.boosts.map((b) => {
                const p = d.posts.find((x) => x.id === b.postId)
                return (
                  <li key={b.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[15px] font-semibold">{p?.title ?? p?.text}</span>
                      <Pill tone={b.status === 'active' ? 'ok' : 'default'}>{b.status === 'active' ? t('Aktibo', 'Active') : t('Tapos na', 'Ended')}</Pill>
                    </div>
                    <p className="text-[14px] text-fg-2">
                      ₱{b.budget} · {t('Abot', 'Reach')} {num(b.results.reach)} · {b.results.clicks} clicks · {b.results.saves} saves
                    </p>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </SubPage>
  )
}

/* ------------------------------ Reservations and queue ------------------------------ */

export function ReservationsPage() {
  const { d, set, t, lang, verified } = useBiz()
  if (!verified)
    return (
      <SubPage title={t('Reservation at pila', 'Reservations and queue')} phase="P2">
        <LockedFeature title={t('Reservations', 'Reservations')} />
      </SubPage>
    )
  const r = d.reservations
  const setR = (p: Partial<typeof r>) => set((x) => ({ ...x, reservations: { ...x.reservations, ...p } }))
  return (
    <SubPage title={t('Reservation at pila', 'Reservations and queue')} phase="P2">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('Pila', 'Queue')} icon={<Clock3 size={20} />}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-display text-[40px] font-bold leading-none">{d.queue.waiting}</p>
              <p className="text-[15px] text-fg-2">{t('naghihintay ngayon', 'waiting now')}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 font-display text-[14px] font-medium">{d.queue.open ? t('Bukas ang pila', 'Queue open') : t('Naka-pause', 'Paused')}</p>
              <Toggle label={t('Status ng pila', 'Queue status')} checked={d.queue.open} onChange={(v) => set((x) => ({ ...x, queue: { ...x.queue, open: v } }))} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => set((x) => ({ ...x, queue: { ...x.queue, waiting: Math.max(0, x.queue.waiting - 1) } }))}>
              {t('Tawagin ang susunod', 'Call next')}
            </Button>
            <Button variant="ghost" onClick={() => set((x) => ({ ...x, queue: { ...x.queue, waiting: x.queue.waiting + 1 } }))}>
              + {t('Walk-in', 'Walk-in')}
            </Button>
          </div>
        </Card>
        <Card title={t('Settings ng mesa', 'Table settings')} icon={<CalendarCheck size={20} />}>
          <div className="flex items-center justify-between">
            <span className="text-[16px]">{t('Tumanggap ng reservation', 'Accept reservations')}</span>
            <Toggle label="Reservations" checked={r.enabled} onChange={(v) => setR({ enabled: v })} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {(
              [
                ['tables', t('Mesa', 'Tables')],
                ['maxParty', t('Max na tao', 'Max party')],
                ['slot', t('Minuto bawat slot', 'Minutes per slot')],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="block">
                <span className="mb-1.5 block font-display text-[13px] font-medium">{l}</span>
                <input type="number" min={1} value={r[k]} onChange={(e) => setR({ [k]: Number(e.target.value) })} className={field} />
              </label>
            ))}
          </div>
        </Card>
      </div>
      <Card title={t('Mga request', 'Incoming requests')}>
        <ul className="divide-y divide-line">
          {d.requests.map((q) => (
            <li key={q.id} className="flex min-h-16 flex-wrap items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px] font-semibold">
                  {q.nick} · {q.party} {t('tao', 'people')}
                </span>
                <span className="text-[14px] text-fg-2">
                  {longDate(q.at, lang)} · {time12(q.at)}
                  {q.note && ` · ${q.note}`}
                </span>
              </span>
              {q.status === 'new' ? (
                <span className="flex gap-2">
                  <Button size="sm" icon={<Check size={16} />} onClick={() => set((x) => ({ ...x, requests: x.requests.map((y) => (y.id === q.id ? { ...y, status: 'accepted' } : y)) }))}>
                    {t('Tanggapin', 'Accept')}
                  </Button>
                  <Button size="sm" variant="danger" icon={<X size={16} />} onClick={() => set((x) => ({ ...x, requests: x.requests.map((y) => (y.id === q.id ? { ...y, status: 'declined' } : y)) }))}>
                    {t('Tanggihan', 'Decline')}
                  </Button>
                </span>
              ) : (
                <Pill tone={q.status === 'accepted' ? 'ok' : 'danger'}>{q.status === 'accepted' ? t('Tinanggap', 'Accepted') : t('Tinanggihan', 'Declined')}</Pill>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </SubPage>
  )
}
