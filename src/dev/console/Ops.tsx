import { Download, ExternalLink, EyeOff, LayoutGrid, Search, Trash2, Undo2, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { FLAGS, initialConsole, useConsole, useCurrentDev, type Announcement } from '@/app/console'
import { useStore } from '@/app/store'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { src } from '@/lib/media'
import { fmtRel, refreshModeration, useModeration, type ModItem } from './data'
import { Badge, Empty, Field, PageHead, Panel, download, field } from './ui'

const APP = import.meta.env.BASE_URL

/* ------------------------------ Businesses ------------------------------ */

export function BusinessesPage() {
  const { c, update } = useConsole()
  const { showToast } = useStore()
  const [q, setQ] = useState('')
  const [businesses, setBusinesses] = useState<null | {
    id: string; name: string; business_type: string | null; price_range: string | null
    city: string; live: boolean; verification_status: string; cover_url: string | null
    reviews: { stars: number; hidden: boolean }[]
  }[]>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id,name,business_type,price_range,city,live,verification_status,cover_url,reviews(stars,hidden)')
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        showToast({ text: `Couldn’t load businesses. Details: ${error.message}`, expression: 'unsure' })
        return
      }
      setBusinesses(data ?? [])
    }
    void load()
    return () => { active = false }
  }, [showToast])

  const list = (businesses ?? []).filter((business) =>
    !q.trim() || `${business.name} ${business.city} ${business.business_type ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const toggle = (key: 'featuredPlaces' | 'hiddenPlaces', id: string, name: string) => {
    const on = !c[key].includes(id)
    update((x) => ({ ...x, [key]: on ? [...x[key], id] : x[key].filter((y) => y !== id) }), { area: 'Businesses', action: `${on ? (key === 'featuredPlaces' ? 'Featured' : 'Hid') : key === 'featuredPlaces' ? 'Unfeatured' : 'Unhid'} ${name}`, target: id })
  }
  return (
    <>
      <PageHead title="Businesses" sub={`${businesses?.length ?? '…'} database records · ${c.featuredPlaces.length} featured · ${c.hiddenPlaces.length} hidden`} />
      <Panel className="mt-4" pad={false}>
        <div className="border-b border-line p-4 md:p-5">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search businesses" aria-label="Search businesses" className={cn(field, 'pl-10')} />
          </div>
        </div>
        {list.length ? <ul className="divide-y divide-line">
          {list.map((business) => {
            const reviews = business.reviews.filter((review) => !review.hidden)
            const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length : null
            const p = {
              id: business.id,
              name: business.name,
              category: business.business_type || 'Uncategorized',
              area: business.city || 'Location not set',
            }
            const featured = c.featuredPlaces.includes(p.id)
            const hidden = c.hiddenPlaces.includes(p.id)
            return (
              <li key={p.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 md:px-5', hidden && 'opacity-60')}>
                {business.cover_url
                  ? <img src={business.cover_url} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" loading="lazy" />
                  : <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-sunken font-display font-semibold text-fg-2">{p.name.slice(0, 1)}</div>}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 font-display text-[15px] font-semibold">
                    {p.name}
                    {featured && <Badge tone="orange">Featured</Badge>}
                    {hidden && <Badge tone="caution">Hidden</Badge>}
                    <Badge tone={business.verification_status === 'verified' ? 'ok' : business.verification_status === 'pending' ? 'caution' : 'neutral'}>
                      {business.verification_status === 'needs-docs' ? 'Needs documents' : business.verification_status || 'Not verified'}
                    </Badge>
                  </p>
                  <p className="text-[13px] text-fg-2">
                    {p.category} · {p.area} · {rating === null ? 'No reviews' : `★ ${rating.toFixed(1)} (${reviews.length})`} · {business.live ? 'Live' : 'Not published'}
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
        </ul> : <Empty title={businesses === null ? 'Loading businesses…' : 'No businesses yet'} body={businesses === null ? undefined : 'Business profiles will appear here when they’re added.'} />}
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
  const [source, setSource] = useState<'all' | 'traveler' | 'biz'>('all')
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
  const remove = async (m: ModItem, reason: string) => {
    const { error } = await supabase.rpc('set_dev_console_content_hidden', {
      p_item_id: m.id,
      p_kind: m.kind,
      p_hidden: true,
    })
    if (error) {
      showToast({ text: `Couldn’t hide this ${m.kind}. Details: ${error.message}`, expression: 'unsure' })
      return
    }
    update((x) => ({ ...x, removed: [{ id: m.id, kind: m.kind, reason, at: new Date().toISOString(), by: dev?.name }, ...x.removed.filter((r) => r.id !== m.id)] }), { area: 'Moderation', action: `Removed ${m.kind} by ${m.nick} on ${m.placeName} (${reason})`, target: m.authorId })
    setTarget(null)
    refreshModeration()
    showToast({ text: `${m.kind === 'review' ? 'Review' : 'Comment'} removed and hidden from everyone.`, expression: 'pointing' })
  }
  const restore = async (m: ModItem) => {
    const { error } = await supabase.rpc('set_dev_console_content_hidden', {
      p_item_id: m.id,
      p_kind: m.kind,
      p_hidden: false,
    })
    if (error) {
      showToast({ text: `Couldn’t restore this ${m.kind}. Details: ${error.message}`, expression: 'unsure' })
      return
    }
    update((x) => ({ ...x, removed: x.removed.filter((r) => r.id !== m.id) }), { area: 'Moderation', action: `Restored ${m.kind} by ${m.nick} on ${m.placeName}`, target: m.authorId })
    refreshModeration()
    showToast({ text: `${m.kind === 'review' ? 'Review' : 'Comment'} restored.`, expression: 'celebrating' })
  }

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
          <Empty title={showRemoved ? 'No removed content' : 'No matching content'} body={showRemoved ? 'Reviews and comments you remove will appear here.' : 'Try changing your filters or search terms.'} />
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
    showToast({ text: next.on ? 'Announcement published.' : 'Announcement turned off.', expression: 'celebrating' })
  }
  const saveM = () => {
    update((x) => ({ ...x, maintenance: m }), { area: 'Announcements', action: m.on ? 'Turned maintenance mode on' : 'Saved maintenance settings (off)' })
    showToast({ text: m.on ? 'Maintenance mode enabled.' : 'Maintenance settings saved.', expression: m.on ? 'sleeping' : 'celebrating' })
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
      <PageHead title="Feature flags" sub="Database-backed settings apply to everyone using the app." />
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

type Action = { id: string; title: string; body: string; run: () => void | Promise<void> }

export function DataToolsPage() {
  const { c, update } = useConsole()
  const [confirm, setConfirm] = useState<Action | null>(null)
  const reset: Action = {
    id: 'console',
    title: 'Reset console data',
    body: 'Resets database-backed console settings and operations state. Auth users, profiles, businesses and content are not deleted.',
    run: async () => {
      await update((x) => ({ ...initialConsole, devAccounts: x.devAccounts, devSession: x.devSession }), { area: 'Data', action: 'Reset console data' })
      location.reload()
    },
  }
  const exportState = () => {
    download(`bitinary-console-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'bitinary-console', exportedAt: new Date().toISOString(), state: c }, null, 2), 'application/json')
    update((x) => x, { area: 'Data', action: 'Exported console state' })
  }

  return (
    <>
      <PageHead title="Data tools" sub="Export and manage console data stored in Supabase. Auth credentials are never included." />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Panel title="Database snapshot" sub="Exports the currently loaded developer-console state as JSON.">
          <Button icon={<Download size={17} />} onClick={exportState}>Export console state</Button>
        </Panel>
        <Panel title="Reset console data">
          <p className="text-[14px] text-fg-2">{reset.body}</p>
          <Button className="mt-3" variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirm(reset)}>
            Reset console data
          </Button>
        </Panel>
        <div className="lg:col-span-2">
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
          { label: 'Reset', destructive: true, bold: true, onClick: () => (confirm?.run(), setConfirm(null)) },
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
        sub={`Last ${c.log.length} database-backed console actions`}
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
          <Empty title="No activity yet" body="Banner edits, user actions, theme changes, and resets will appear here." />
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
