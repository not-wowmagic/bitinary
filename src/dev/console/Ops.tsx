import { BadgeCheck, Download, ExternalLink, EyeOff, FileUp, KeyRound, LayoutGrid, RotateCcw, Search, Sparkles, Star, Trash2, Undo2, Upload, Wrench } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useVerifications } from '@/app/verification'
import { StateBadge } from './Verification'
import { readBiz, writeBiz } from '@/app/bizBridge'
import { FLAGS, useConsole, useCurrentDev, type Announcement } from '@/app/console'
import { useStore } from '@/app/store'
import { demoData } from '@/biz/store'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { LINKED_PLACE_ID, places } from '@/data/places'
import { cn } from '@/lib/cn'
import { img } from '@/lib/format'
import { src } from '@/lib/media'
import { STORAGE_BUDGET, fmtRel, kb, storageUsage, useModeration, type ModItem } from './data'
import { Badge, Empty, Field, PageHead, Panel, download, field } from './ui'

const APP = import.meta.env.BASE_URL

/* ------------------------------ Businesses ------------------------------ */

export function BusinessesPage() {
  const { c, update } = useConsole()
  const { showToast } = useStore()
  const [q, setQ] = useState('')
  const [, force] = useState(0)
  const ver = useVerifications()
  const vOf = (id: string) => ver.find((r) => r.placeId === id)?.v
  const list = places.filter((p) => !q.trim() || `${p.name} ${p.area} ${p.category}`.toLowerCase().includes(q.trim().toLowerCase()))
  const toggle = (key: 'featuredPlaces' | 'hiddenPlaces', id: string, name: string) => {
    const on = !c[key].includes(id)
    update((x) => ({ ...x, [key]: on ? [...x[key], id] : x[key].filter((y) => y !== id) }), { area: 'Businesses', action: `${on ? (key === 'featuredPlaces' ? 'Featured' : 'Hid') : key === 'featuredPlaces' ? 'Unfeatured' : 'Unhid'} ${name}`, target: id })
  }
  const verify = (status: 'verified' | 'needs-docs' | 'none') => {
    writeBiz((d) => ({
      ...d,
      business: { ...d.business, verification: { ...d.business.verification, status } },
      notifs: [{ id: `n-${Date.now()}`, kind: 'report', at: new Date().toISOString(), to: '/biz/stats/backgrounds#verify', tl: status === 'verified' ? 'Verified na ang negosyo mo!' : status === 'needs-docs' ? 'Kailangan pa namin ng dokumento para sa beripikasyon.' : 'Na-reset ang beripikasyon mo.', en: status === 'verified' ? 'Your business is now verified!' : status === 'needs-docs' ? 'We need more documents to verify your business.' : 'Your verification was reset.' }, ...d.notifs],
    }))
    update((x) => x, { area: 'Businesses', action: `Set Kainan ni Mang Ben verification to ${status}`, target: LINKED_PLACE_ID })
    showToast({ text: 'Verification updated. The owner got a notification.', expression: 'celebrating' })
    force((n) => n + 1)
  }
  return (
    <>
      <PageHead title="Businesses" sub={`${places.length} listed · ${c.featuredPlaces.length} featured · ${c.hiddenPlaces.length} hidden`} />
      <Link to="/bitinarydev/verification" className="card flex items-center gap-3 p-4">
        <BadgeCheck size={22} className="shrink-0 text-link" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-semibold">DTI and Business permit verification</span>
          <span className="block text-[13px] text-fg-2">{ver.filter((r) => r.v.status === 'pending').length} pending · review documents, dates and approve in Verification</span>
        </span>
        <ExternalLink size={17} className="text-fg-2" />
      </Link>
      <Panel className="mt-4" pad={false}>
        <div className="border-b border-line p-4 md:p-5">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search businesses" aria-label="Search businesses" className={cn(field, 'pl-10')} />
          </div>
        </div>
        <ul className="divide-y divide-line">
          {list.map((p) => {
            const featured = c.featuredPlaces.includes(p.id)
            const hidden = c.hiddenPlaces.includes(p.id)
            return (
              <li key={p.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 md:px-5', hidden && 'opacity-60')}>
                <img src={img(p.image, 120, 120)} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 font-display text-[15px] font-semibold">
                    {p.name}
                    {p.id === LINKED_PLACE_ID && <Badge tone="dark">Linked to /biz</Badge>}
                    {featured && <Badge tone="orange">Featured</Badge>}
                    {hidden && <Badge tone="caution">Hidden</Badge>}
                    {vOf(p.id) && (
                      <Link to={`/bitinarydev/verification/${p.id}`} onClick={(e) => e.stopPropagation()}>
                        <StateBadge v={vOf(p.id)!} />
                      </Link>
                    )}
                  </p>
                  <p className="text-[13px] text-fg-2">
                    {p.category} · {p.area} · <Star size={12} className="inline text-amber" fill="currentColor" strokeWidth={0} /> {p.rating} ({p.reviews}) · verified {p.verifiedDays}d ago
                  </p>
                </div>
                <label className="flex items-center gap-2 text-[13px] font-medium">
                  Featured
                  <Toggle label={`Feature ${p.name}`} checked={featured} onChange={() => toggle('featuredPlaces', p.id, p.name)} />
                </label>
                <label className="flex items-center gap-2 text-[13px] font-medium">
                  Hidden
                  <Toggle label={`Hide ${p.name}`} checked={hidden} onChange={() => toggle('hiddenPlaces', p.id, p.name)} />
                </label>
                <a href={`${APP}shop/${p.id}`} target="_blank" rel="noopener" aria-label={`Open ${p.name}`} className="flex h-10 w-10 items-center justify-center rounded-full text-link hover:bg-sunken">
                  <ExternalLink size={17} />
                </a>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}

/* ------------------------------ Moderation ------------------------------ */

const REASONS = ['Spam', 'Harassment', 'Fake review', 'Personal info', 'Off-topic']

export function ModerationPage() {
  const { update } = useConsole()
  const dev = useCurrentDev()
  const { showToast } = useStore()
  const items = useModeration()
  const [params, setParams] = useSearchParams()
  const kind = (params.get('kind') as 'review' | 'comment' | null) ?? 'all'
  const flagged = params.has('flagged')
  const [source, setSource] = useState<'all' | 'traveler' | 'sample' | 'biz'>('all')
  const [showRemoved, setShowRemoved] = useState(false)
  const [q, setQ] = useState('')
  const [target, setTarget] = useState<ModItem | null>(null)
  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }
  const list = useMemo(
    () => items.filter((m) => (kind === 'all' || m.kind === kind) && (!flagged || m.flags.length > 0) && (source === 'all' || m.source === source) && (showRemoved ? !!m.removed : !m.removed) && (!q.trim() || `${m.text} ${m.nick} ${m.placeName}`.toLowerCase().includes(q.trim().toLowerCase()))),
    [items, kind, flagged, source, showRemoved, q],
  )
  const remove = (m: ModItem, reason: string) => {
    update((x) => ({ ...x, removed: [{ id: m.id, kind: m.kind, reason, at: new Date().toISOString(), by: dev?.name }, ...x.removed.filter((r) => r.id !== m.id)] }), { area: 'Moderation', action: `Removed ${m.kind} by ${m.nick} on ${m.placeName} (${reason})`, target: m.authorId })
    setTarget(null)
    showToast({ text: `Removed. It's hidden for everyone.`, expression: 'pointing' })
  }
  const restore = (m: ModItem) => update((x) => ({ ...x, removed: x.removed.filter((r) => r.id !== m.id) }), { area: 'Moderation', action: `Restored ${m.kind} by ${m.nick} on ${m.placeName}`, target: m.authorId })

  return (
    <>
      <PageHead title="Moderation" sub={`${items.filter((m) => m.flags.length && !m.removed).length} flagged · ${items.filter((m) => m.removed).length} removed`} />
      <Panel pad={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:p-5">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text, nickname or business" aria-label="Search reviews and comments" className={cn(field, 'pl-10')} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Type" value={kind} onChange={(v) => setParam('kind', v === 'all' ? null : v)} options={[{ value: 'all', label: 'All' }, { value: 'review', label: 'Reviews' }, { value: 'comment', label: 'Comments' }]} />
            <select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value as typeof source)} className={cn(field, 'w-auto')}>
              <option value="all">All sources</option>
              <option value="traveler">Written by travelers</option>
              <option value="biz">Bitinary Business data</option>
              <option value="sample">Sample data</option>
            </select>
            <label className="flex items-center gap-2 text-[14px] font-medium">
              <Toggle label="Flagged only" checked={flagged} onChange={(v) => setParam('flagged', v ? '1' : null)} /> Flagged only
            </label>
            <label className="flex items-center gap-2 text-[14px] font-medium">
              <Toggle label="Show removed" checked={showRemoved} onChange={setShowRemoved} /> Removed
            </label>
          </div>
        </div>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.slice(0, 120).map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-3 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-fg-2">
                    <Badge tone={m.kind === 'review' ? 'orange' : 'neutral'}>{m.kind === 'review' ? `Review${m.stars ? ` · ${m.stars}★` : ''}` : 'Comment'}</Badge>
                    <b className="text-fg">{m.nick}</b> on {m.placeName} · {fmtRel(m.at)}
                    {m.source === 'sample' && <Badge>Sample</Badge>}
                    {m.flags.map((f) => (
                      <Badge key={f} tone="caution">
                        {f}
                      </Badge>
                    ))}
                    {m.removed && <Badge tone="danger">Removed{m.removed.by ? ` by ${m.removed.by}` : ''} · {m.removed.reason}</Badge>}
                  </p>
                  <p className="mt-1 text-[15px]">{m.text}</p>
                  {m.photos.length > 0 && (
                    <div className="mt-2 flex gap-1.5">
                      {m.photos.map((p, i) => (
                        <img key={i} src={src(p, 120, 120)} alt="" className="h-12 w-12 rounded-[10px] object-cover" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <a href={`${APP}shop/${m.placeId}${m.kind === 'review' ? '?tab=reviews' : ''}`} target="_blank" rel="noopener" className="flex h-10 items-center gap-1 rounded-full px-3 font-display text-[13px] font-medium text-link hover:bg-sunken">
                    <ExternalLink size={15} /> Open
                  </a>
                  {m.removed ? (
                    <Button size="sm" variant="secondary" icon={<Undo2 size={15} />} onClick={() => restore(m)}>
                      Restore
                    </Button>
                  ) : (
                    <Button size="sm" variant="danger" icon={<EyeOff size={15} />} onClick={() => setTarget(m)}>
                      Remove
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title={showRemoved ? 'Nothing removed' : 'All clear'} body={showRemoved ? 'Removed reviews and comments show here.' : 'No reviews or comments match these filters.'} />
        )}
      </Panel>
      <Sheet open={!!target} onClose={() => setTarget(null)} title="Why remove this?">
        {target && <p className="mb-3 line-clamp-3 rounded-[14px] bg-sunken p-3 text-[14px] dark:bg-elevated">"{target.text}"</p>}
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button key={r} onClick={() => target && remove(target, r)} className="flex h-12 w-full items-center rounded-2xl bg-sunken px-4 text-left text-body font-semibold dark:bg-elevated">
              {r}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

/* ------------------------------ Announcements ------------------------------ */

const toneCls = { info: 'bg-brown text-cream', caution: 'bg-caution-bg text-caution', promo: 'bg-primary text-ink' }

export function AnnouncementsPage() {
  const { c, update } = useConsole()
  const { showToast } = useStore()
  const [a, setA] = useState<Announcement>(c.announcement)
  const [m, setM] = useState(c.maintenance)
  const save = () => {
    // A new id when the text changes, so people who dismissed the old one see the new one.
    const next = { ...a, id: a.text !== c.announcement.text ? `a${Date.now()}` : a.id }
    update((x) => ({ ...x, announcement: next }), { area: 'Announcements', action: next.on ? `Published announcement "${next.text.slice(0, 50)}"` : 'Turned the announcement off' })
    setA(next)
    showToast({ text: next.on ? 'Announcement is live' : 'Announcement saved (off)', expression: 'celebrating' })
  }
  const saveM = () => {
    update((x) => ({ ...x, maintenance: m }), { area: 'Announcements', action: m.on ? 'Turned maintenance mode on' : 'Saved maintenance settings (off)' })
    showToast({ text: m.on ? 'Maintenance mode is on' : 'Maintenance settings saved', expression: m.on ? 'sleeping' : 'celebrating' })
  }
  return (
    <>
      <PageHead title="Announcements" sub="A message bar across the app, and maintenance mode." />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel title="Announcement bar" action={<Toggle label="Announcement on" checked={a.on} onChange={(on) => setA({ ...a, on })} />}>
          <div className="space-y-4">
            <Field label="Message" htmlFor="an-text" hint={`${a.text.length}/140 · Type it in the language travelers read (Tagalog or English).`}>
              <textarea id="an-text" value={a.text} onChange={(e) => setA({ ...a, text: e.target.value.slice(0, 140) })} rows={3} placeholder="Libreng delivery ngayong Araw ng Kalayaan!" className={cn(field, 'h-auto resize-none py-2.5')} />
            </Field>
            <Field label="Style">
              <Segmented className="w-full" label="Style" value={a.tone} onChange={(tone) => setA({ ...a, tone })} options={[{ value: 'info', label: 'Info' }, { value: 'promo', label: 'Promo' }, { value: 'caution', label: 'Warning' }]} />
            </Field>
            <Field label="Show in">
              <Segmented className="w-full" label="Show in" value={a.target} onChange={(target) => setA({ ...a, target })} options={[{ value: 'all', label: 'Everywhere' }, { value: 'traveler', label: 'Traveler app' }, { value: 'biz', label: 'Business' }]} />
            </Field>
            <Field label="Link (optional)" htmlFor="an-link" hint="An app page like /search, or a full website link">
              <input id="an-link" value={a.link ?? ''} onChange={(e) => setA({ ...a, link: e.target.value || undefined })} placeholder="/search" className={field} />
            </Field>
            <div>
              <p className="mb-1.5 font-display text-[14px] font-medium">Preview</p>
              <div className={cn('rounded-[14px] px-4 py-2.5 text-[14px] font-semibold', toneCls[a.tone])}>{a.text || 'Your message shows here'}</div>
            </div>
            <Button block onClick={save} disabled={a.on && !a.text.trim()}>
              Save announcement
            </Button>
          </div>
        </Panel>
        <Panel title="Maintenance mode" sub="Replaces the traveler app and /biz with a maintenance screen. This console and /dev keep working." action={<Toggle label="Maintenance on" checked={m.on} onChange={(on) => setM({ ...m, on })} />}>
          <div className="space-y-4">
            <Field label="Message" htmlFor="mt-msg">
              <textarea id="mt-msg" value={m.message} onChange={(e) => setM({ ...m, message: e.target.value.slice(0, 200) })} rows={3} className={cn(field, 'h-auto resize-none py-2.5')} />
            </Field>
            <Field label="Back by (optional)" htmlFor="mt-until">
              <input id="mt-until" type="datetime-local" value={m.until ?? ''} onChange={(e) => setM({ ...m, until: e.target.value || undefined })} className={field} />
            </Field>
            <div className="flex items-center gap-3 rounded-[16px] bg-sunken p-4 dark:bg-elevated">
              <Wrench size={20} className="shrink-0 text-link" />
              <p className="text-[14px] text-fg-2">{m.on ? 'Saving will put the app in maintenance right away.' : 'Turn the switch on, then save.'}</p>
            </div>
            <Button block variant={m.on ? 'danger' : 'primary'} onClick={saveM}>
              {m.on ? 'Save and turn on' : 'Save'}
            </Button>
          </div>
        </Panel>
      </div>
    </>
  )
}

/* ------------------------------ Feature flags ------------------------------ */

export function FlagsPage() {
  const { c, update } = useConsole()
  return (
    <>
      <PageHead title="Feature flags" sub="Turn features on or off for everyone using the app on this device." />
      <Panel pad={false}>
        <ul className="divide-y divide-line">
          {FLAGS.map((f) => (
            <li key={f.id} className="flex items-center gap-4 px-4 py-4 md:px-5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-display text-[16px] font-semibold">
                  {f.label}
                  {!c.flags[f.id] && <Badge tone="caution">Off</Badge>}
                </p>
                <p className="text-[14px] text-fg-2">{f.description}</p>
              </div>
              <Toggle label={f.label} checked={c.flags[f.id]} onChange={(on) => update((x) => ({ ...x, flags: { ...x.flags, [f.id]: on } }), { area: 'Feature flags', action: `Turned ${f.label} ${on ? 'on' : 'off'}` })} />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}

/* ------------------------------ Data tools ------------------------------ */

const TRAVELER_KEYS = ['session', 'role', 'profile2', 'consent2', 'prefs2', 'business2', 'setupDone2', 'resume', 'hasAccount', 'accounts2', 'authAttempts', 'authLockedUntil', 'onboarded', 'saved', 'savedItineraries', 'itineraryStops', 'moments', 'dataSaver', 'subtitles', 'installDismissed', 'cameraTipSeen', 'lang', 'announcementsDismissed']
const allKeys = () => Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!).filter((k) => k?.startsWith('bitinary:'))
const put = (k: string, v: unknown) => localStorage.setItem(`bitinary:${k}`, JSON.stringify(v))

type Action = { id: string; title: string; body: string; run: () => void }

export function DataToolsPage() {
  const { c, update } = useConsole()
  const { showToast } = useStore()
  const [confirm, setConfirm] = useState<Action | null>(null)
  const [importing, setImporting] = useState<{ data: Record<string, string>; name: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const usage = storageUsage()
  const pct = Math.min(100, Math.round((usage.total / STORAGE_BUDGET) * 100))

  const logThenReload = (action: string, fn: () => void) => {
    update((x) => x, { area: 'Data', action })
    // Let the log write land before clearing and reloading.
    setTimeout(() => {
      fn()
      location.reload()
    }, 50)
  }
  const keepConsole = () => {
    const raw = localStorage.getItem('bitinary:console')
    return () => raw && localStorage.setItem('bitinary:console', raw)
  }
  const actions: Action[] = [
    { id: 'traveler', title: 'Reset traveler data', body: 'Signs everyone out and clears accounts, saved places, trips and Moments on this device.', run: () => logThenReload('Reset traveler data', () => TRAVELER_KEYS.forEach((k) => localStorage.removeItem(`bitinary:${k}`))) },
    { id: 'biz', title: 'Reset business data', body: 'Clears the Bitinary Business account, posts, reviews and replies.', run: () => logThenReload('Reset business data', () => localStorage.removeItem('bitinary:biz')) },
    { id: 'social', title: 'Reset reviews & comments', body: "Clears travelers' reviews, comments and likes for places without a business account.", run: () => logThenReload('Reset reviews and comments', () => localStorage.removeItem('bitinary:social')) },
    {
      id: 'console',
      title: 'Reset console',
      body: 'Restores default banners, theme, flags and announcements. Keeps developer accounts and keeps you signed in.',
      run: () => logThenReload('Reset console', () => localStorage.setItem('bitinary:console', JSON.stringify({ devAccounts: c.devAccounts, devSession: c.devSession }))),
    },
    {
      id: 'factory',
      title: 'Factory reset',
      body: 'Deletes everything Bitinary saved on this device, including developer accounts (the demo accounts come back) and the log.',
      run: () => {
        allKeys().forEach((k) => localStorage.removeItem(k))
        location.reload()
      },
    },
  ]

  const loadDemo = () =>
    logThenReload('Loaded the full demo', () => {
      const restore = keepConsole()
      const now = new Date().toISOString()
      put('session', { kind: 'user', role: 'traveler', method: 'email', accountId: 'acc-andrea' })
      put('role', 'traveler')
      put('setupDone2', true)
      put('hasAccount', true)
      put('resume', null)
      put('lang', 'tl')
      put('profile2', { name: 'Andrea Reyes', nickname: 'Andrea', email: 'andrea@example.ph', mobile: '9171234567', city: 'Maynila' })
      put('biz', { ...demoData, reviews: [{ id: 'rv-demo', nick: 'Andrea', authorId: 'acc-andrea', stars: 5, text: 'Ang sarap ng kare-kare! Mabilis din ang serve at mabait ang staff.', photos: [], at: now, checkin: { at: now, via: 'code' }, fresh: true }, ...demoData.reviews] })
      put('social', { reviews: [{ id: 'rv-demo2', placeId: 'p2', nick: 'Andrea', authorId: 'acc-andrea', stars: 4, text: 'Masarap ang kapeng barako, tahimik na lugar para magtrabaho.', photos: [], at: now, visited: true }], comments: [{ id: 'cm-demo', postId: 'p2-ph0', nick: 'Andrea', authorId: 'acc-andrea', text: 'Pupunta ako bukas!', at: now }], liked: [] })
      restore()
    })

  const exportAll = () => {
    const data = Object.fromEntries(allKeys().map((k) => [k, localStorage.getItem(k) ?? '']))
    download(`bitinary-snapshot-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'bitinary', exportedAt: new Date().toISOString(), data }, null, 2), 'application/json')
    update((x) => x, { area: 'Data', action: 'Exported a snapshot' })
  }
  const readImport = async (f?: File) => {
    if (!f) return
    try {
      const json = JSON.parse(await f.text())
      const data = json?.data
      if (json?.app !== 'bitinary' || !data || typeof data !== 'object' || !Object.keys(data).every((k) => k.startsWith('bitinary:') && typeof data[k] === 'string')) throw new Error('bad')
      setImporting({ data, name: f.name })
    } catch {
      showToast({ text: "That file isn't a Bitinary snapshot.", expression: 'unsure' })
    }
  }

  return (
    <>
      <PageHead title="Data tools" sub="Everything is stored in this browser. Nothing is sent to a server." />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <Panel title="Storage" sub={`${kb(usage.total)} of about 5 MB used`}>
            <div className="h-3 overflow-hidden rounded-full bg-sunken dark:bg-elevated" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
              <div className={cn('h-full rounded-full', pct > 80 ? 'bg-danger' : pct > 60 ? 'bg-caution' : 'bg-primary')} style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
            <ul className="mt-4 space-y-1.5 text-[14px]">
              {usage.keys.slice(0, 10).map((k) => (
                <li key={k.key} className="flex justify-between gap-3">
                  <span className="truncate font-mono text-[13px] text-fg-2">{k.key}</span>
                  <span className="tabular-nums">{kb(k.bytes)}</span>
                </li>
              ))}
            </ul>
            {pct > 80 && <p className="mt-3 text-[13px] font-semibold text-danger">Storage is almost full. Photo reviews and uploads may fail.</p>}
          </Panel>
          <Panel title="Snapshots" sub="Save the whole app state to a file, or bring one back.">
            <div className="flex flex-wrap gap-2">
              <Button icon={<Download size={17} />} onClick={exportAll}>
                Export JSON
              </Button>
              <Button variant="secondary" icon={<Upload size={17} />} onClick={() => fileRef.current?.click()}>
                Import JSON
              </Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => (readImport(e.target.files?.[0]), (e.target.value = ''))} />
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Demo">
            <p className="text-[14px] text-fg-2">Signs in Andrea (traveler), loads the Kainan ni Mang Ben business with posts and reviews, and adds a few of Andrea's reviews and comments.</p>
            <Button className="mt-3" icon={<Sparkles size={17} />} onClick={() => setConfirm({ id: 'demo', title: 'Load the full demo?', body: 'This replaces the current traveler and business data on this device.', run: loadDemo })}>
              Load full demo
            </Button>
          </Panel>
          <Panel title="Reset" pad={false}>
            <ul className="divide-y divide-line">
              {actions.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-display text-[15px] font-semibold', a.id === 'factory' && 'text-danger')}>{a.title}</p>
                    <p className="text-[13px] text-fg-2">{a.body}</p>
                  </div>
                  <Button size="sm" variant={a.id === 'factory' ? 'danger' : 'secondary'} icon={<Trash2 size={15} />} onClick={() => setConfirm(a)}>
                    Reset
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Review tools">
            <div className="flex flex-wrap gap-2">
              {[
                ['Screen Index', 'dev'],
                ['Business Screen Index', 'dev/biz'],
                ['Components', 'dev/components'],
                ['Jimbot icon set', 'dev/mascot'],
              ].map(([l, p]) => (
                <a key={p} href={`${APP}${p}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sunken px-4 font-display text-[14px] font-medium dark:bg-elevated">
                  <LayoutGrid size={15} /> {l}
                </a>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <IOSAlert
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.body}
        actions={[
          { label: 'Cancel', onClick: () => setConfirm(null) },
          { label: confirm?.id === 'demo' ? 'Load' : 'Reset', destructive: confirm?.id !== 'demo', bold: true, onClick: () => (confirm?.run(), setConfirm(null)) },
        ]}
      />
      <IOSAlert
        open={!!importing}
        title="Import this snapshot?"
        message={importing ? `${importing.name} has ${Object.keys(importing.data).length} saved items. It replaces everything Bitinary saved on this device, then reloads.` : ''}
        actions={[
          { label: 'Cancel', onClick: () => setImporting(null) },
          {
            label: 'Import',
            bold: true,
            onClick: () => {
              if (!importing) return
              allKeys().forEach((k) => localStorage.removeItem(k))
              Object.entries(importing.data).forEach(([k, v]) => localStorage.setItem(k, v))
              location.reload()
            },
          },
        ]}
      />
    </>
  )
}

/* ------------------------------ Activity log ------------------------------ */

export function ActivityLogPage() {
  const { c, update } = useConsole()
  const [area, setArea] = useState('all')
  const [who, setWho] = useState('all')
  const [clear, setClear] = useState(false)
  const areas = [...new Set(c.log.map((l) => l.area))]
  const people = [...new Set(c.log.map((l) => l.by).filter(Boolean))] as string[]
  const list = c.log.filter((l) => (area === 'all' || l.area === area) && (who === 'all' || l.by === who))
  return (
    <>
      <PageHead
        title="Activity log"
        sub={`Last ${c.log.length} console actions on this device`}
        actions={
          <>
            <select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} className={cn(field, 'w-auto')}>
              <option value="all">All areas</option>
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <select aria-label="Developer" value={who} onChange={(e) => setWho(e.target.value)} className={cn(field, 'w-auto')}>
              <option value="all">All developers</option>
              {people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <Button variant="ghost" icon={<Trash2 size={17} />} disabled={!c.log.length} onClick={() => setClear(true)}>
              Clear
            </Button>
          </>
        }
      />
      <Panel pad={false}>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
                <Badge>{l.area}</Badge>
                <p className="min-w-0 flex-1 text-[15px]">
                  {l.action}
                  {l.by && <span className="block text-[13px] text-fg-2">by {l.by}</span>}
                </p>
                <time dateTime={l.at} className="text-[13px] text-fg-2" title={new Date(l.at).toLocaleString('en-PH')}>
                  {fmtRel(l.at)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Nothing logged yet" body="Banner edits, user actions, theme changes and resets show up here." />
        )}
      </Panel>
      <IOSAlert
        open={clear}
        title="Clear the activity log?"
        actions={[
          { label: 'Cancel', onClick: () => setClear(false) },
          { label: 'Clear', destructive: true, bold: true, onClick: () => (update((x) => ({ ...x, log: [] })), setClear(false)) },
        ]}
      />
    </>
  )
}
