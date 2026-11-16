import { ArrowDown, ArrowLeft, ArrowUp, Copy, ImagePlus, Pause, Play, Plus, Save, Send, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { bannerActive, useConsole, type Audience, type Banner, type Placement } from '@/app/console'
import { useStore } from '@/app/store'
import { PromoBanner } from '@/components/cards/PromoCarousel'
import { SearchAdView, SponsoredView, StripView } from '@/components/cards/SponsoredCard'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { places } from '@/data/places'
import { promos } from '@/data/promos'
import { cn } from '@/lib/cn'
import { src } from '@/lib/media'
import { shrink } from '@/screens/personalize/TravelerThemes'
import { supabase } from '@/lib/supabase'
import { fmtDate } from './data'
import { Badge, Empty, Field, PageHead, Panel, field } from './ui'

export const PLACEMENTS: { id: Placement; label: string; where: string }[] = [
  { id: 'home-carousel', label: 'Home carousel', where: 'Big promo slides at the top of Home' },
  { id: 'home-sponsored', label: 'Home sponsored', where: 'Two sponsored cards between Home sections' },
  { id: 'search', label: 'Search results', where: 'One sponsored row above search results' },
  { id: 'profile', label: 'Business profiles', where: 'Slim strip under the profile buttons' },
  { id: 'biz-bar', label: 'Bitinary Business bar', where: 'Strip for owners at the top of /biz' },
]
const placementLabel = (p: Placement) => PLACEMENTS.find((x) => x.id === p)!.label

function statusOf(b: Banner) {
  if (b.status === 'draft') return { label: 'Draft', tone: 'neutral' as const }
  if (b.status === 'paused') return { label: 'Paused', tone: 'caution' as const }
  if (b.start && new Date(b.start).getTime() > Date.now()) return { label: 'Scheduled', tone: 'orange' as const }
  if (!bannerActive(b)) return { label: 'Ended', tone: 'neutral' as const }
  return { label: 'Live', tone: 'ok' as const }
}
const ctr = (b: Banner) => (b.stats.views ? `${((b.stats.clicks / b.stats.views) * 100).toFixed(1)}%` : '—')

/** Renders a banner exactly as the app does, for previews. */
export function BannerPreview({ banner }: { banner: Banner }) {
  const noop = () => {}
  if (banner.placement === 'home-carousel') return <PromoBanner banner={banner} onClick={noop} />
  if (banner.placement === 'home-sponsored') return <SponsoredView banner={banner} onClick={noop} />
  if (banner.placement === 'search') return <SearchAdView banner={banner} onClick={noop} />
  return <StripView banner={banner} onClick={noop} />
}

export function BannersPage() {
  const { c, update } = useConsole()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Placement | 'all'>('all')
  const groups = PLACEMENTS.filter((p) => filter === 'all' || p.id === filter).map((p) => ({ ...p, items: c.banners.filter((b) => b.placement === p.id).sort((a, b) => a.priority - b.priority) }))

  const move = (b: Banner, dir: -1 | 1) =>
    update((x) => {
      const same = x.banners.filter((y) => y.placement === b.placement).sort((m, n) => m.priority - n.priority)
      const i = same.findIndex((y) => y.id === b.id)
      const j = i + dir
      if (j < 0 || j >= same.length) return x
      ;[same[i], same[j]] = [same[j], same[i]]
      const order = new Map(same.map((y, k) => [y.id, k]))
      return { ...x, banners: x.banners.map((y) => (order.has(y.id) ? { ...y, priority: order.get(y.id)! } : y)) }
    }, { area: 'Banners', action: `Moved "${b.name}" ${dir < 0 ? 'up' : 'down'}` })
  const setStatus = (b: Banner, status: Banner['status']) => update((x) => ({ ...x, banners: x.banners.map((y) => (y.id === b.id ? { ...y, status } : y)) }), { area: 'Banners', action: `${status === 'live' ? 'Published' : status === 'paused' ? 'Paused' : 'Unpublished'} "${b.name}"` })

  return (
    <>
      <PageHead
        title="Banners & ads"
        sub={`${c.banners.filter((b) => bannerActive(b)).length} live across ${PLACEMENTS.length} placements. Changes show in the app right away.`}
        actions={
          <Button icon={<Plus size={18} />} onClick={() => navigate('new')}>
            New banner
          </Button>
        }
      />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {[{ id: 'all', label: 'All' }, ...PLACEMENTS].map((p) => (
          <button key={p.id} onClick={() => setFilter(p.id as Placement | 'all')} aria-pressed={filter === p.id} className={cn('h-10 shrink-0 rounded-full px-4 font-display text-[14px] font-medium', filter === p.id ? 'bg-brown text-cream dark:bg-primary dark:text-ink' : 'bg-surface text-fg-2 shadow-card')}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {groups.map((g) => (
          <Panel key={g.id} title={g.label} sub={g.where} pad={false} action={<Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => navigate(`new?placement=${g.id}`)}>Add</Button>}>
            {g.items.length ? (
              <ul className="divide-y divide-line">
                {g.items.map((b, i) => {
                  const st = statusOf(b)
                  return (
                    <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
                      <div className="flex flex-col">
                        <button onClick={() => move(b, -1)} disabled={i === 0} aria-label={`Move ${b.name} up`} className="flex h-7 w-8 items-center justify-center rounded-md text-fg-2 hover:bg-sunken disabled:opacity-30">
                          <ArrowUp size={15} />
                        </button>
                        <button onClick={() => move(b, 1)} disabled={i === g.items.length - 1} aria-label={`Move ${b.name} down`} className="flex h-7 w-8 items-center justify-center rounded-md text-fg-2 hover:bg-sunken disabled:opacity-30">
                          <ArrowDown size={15} />
                        </button>
                      </div>
                      {b.image ? <img src={src(b.image, 120, 120)} alt="" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" /> : <span className="h-14 w-14 shrink-0 rounded-[12px] bg-sunken dark:bg-elevated" />}
                      <Link to={b.id} className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[15px] font-semibold">{b.name}</span>
                        <span className="block truncate text-[13px] text-fg-2">
                          {b.start || b.end ? `${fmtDate(b.start)} – ${fmtDate(b.end)}` : 'No end date'} · {b.audience === 'all' ? 'Everyone' : b.audience}
                        </span>
                      </Link>
                      <div className="flex items-center gap-4 text-[13px] text-fg-2">
                        <span className="text-right">
                          <b className="block font-display text-[15px] text-fg">{b.stats.views.toLocaleString()}</b>views
                        </span>
                        <span className="text-right">
                          <b className="block font-display text-[15px] text-fg">{b.stats.clicks.toLocaleString()}</b>clicks
                        </span>
                        <span className="hidden text-right sm:block">
                          <b className="block font-display text-[15px] text-fg">{ctr(b)}</b>CTR
                        </span>
                      </div>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {b.status === 'live' ? (
                        <Button size="sm" variant="secondary" icon={<Pause size={15} />} onClick={() => setStatus(b, 'paused')}>
                          Pause
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" icon={<Play size={15} />} onClick={() => setStatus(b, 'live')}>
                          Publish
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Empty title="No banners for this placement" body="Add a banner to show one here in the app." />
            )}
          </Panel>
        ))}
      </div>
    </>
  )
}

const blank = (placement: Placement): Banner => ({ id: `bn-${Date.now()}`, name: '', placement, status: 'draft', title: '', subtitle: '', cta: 'Tingnan', tone: 'orange', link: { kind: 'place', placeId: places[0].id }, audience: 'all', priority: 99, stats: { views: 0, clicks: 0 }, createdAt: new Date().toISOString() })
const IMAGES = [...new Set([...promos.map((p) => p.image), ...places.flatMap((p) => p.gallery ?? [p.image])])].slice(0, 18)

export function BannerEditor() {
  const { id } = useParams()
  const { c, update } = useConsole()
  const { showToast } = useStore()
  const navigate = useNavigate()
  const existing = c.banners.find((b) => b.id === id)
  const initialPlacement = (new URLSearchParams(location.search).get('placement') as Placement) || 'home-carousel'
  const [b, setB] = useState<Banner>(() => existing ?? blank(initialPlacement))
  const [tried, setTried] = useState(false)
  const [del, setDel] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (p: Partial<Banner>) => setB((x) => ({ ...x, ...p }))

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    const imageSlide = b.placement === 'home-carousel' && b.style === 'image'
    if (!b.title.trim()) e.title = 'Add a title.'
    else if (b.title.length > 60) e.title = 'Keep it under 60 characters.'
    if (!imageSlide && !b.cta.trim()) e.cta = 'Add a button label.'
    else if (b.cta.length > 20) e.cta = 'Keep it under 20 characters.'
    if (imageSlide && !b.image) e.image = 'Upload or pick an image.'
    if (imageSlide && !b.alt?.trim()) e.alt = 'Describe the image for screen readers.'
    else if ((b.alt?.length ?? 0) > 120) e.alt = 'Keep it under 120 characters.'
    if (b.start && b.end && b.end < b.start) e.end = 'End date is before the start date.'
    if (b.link.kind === 'url' && !/^https?:\/\/\S+\.\S+/.test(b.link.url)) e.link = 'Use a full link, like https://example.ph.'
    if (b.link.kind === 'route' && !b.link.path.startsWith('/')) e.link = 'App links start with /, like /search.'
    return e
  }, [b])
  const hiddenTarget = b.link.kind === 'place' && c.hiddenPlaces.includes(b.link.placeId)

  if (id && !existing) {
    return (
      <Panel>
        <Empty title="Banner not found" action={<Button onClick={() => navigate('/bitinarydev/banners')}>Back to banners</Button>} />
      </Panel>
    )
  }

  const save = async (status: Banner['status']) => {
    setTried(true)
    if (Object.keys(errors).length || saving) return
    setSaving(true)
    try {
      const next = { ...b, status, name: b.name.trim() || b.title.trim() }
      if (next.image?.startsWith('data:')) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) throw new Error('Sign in again before uploading a banner image.')
        const blob = await (await fetch(next.image)).blob()
        if (blob.size > 10 * 1024 * 1024) throw new Error('Banner images must be smaller than 10 MB.')
        const path = `${user.id}/banners/${next.id}`
        const { error: uploadError } = await supabase.storage.from('dev-console-assets').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true })
        if (uploadError) throw uploadError
        next.image = supabase.storage.from('dev-console-assets').getPublicUrl(path).data.publicUrl
      }
      await update((x) => ({ ...x, banners: existing ? x.banners.map((y) => (y.id === next.id ? next : y)) : [...x.banners, { ...next, priority: x.banners.filter((y) => y.placement === next.placement).length }] }), { area: 'Banners', action: `${existing ? 'Updated' : 'Created'} "${next.name}" (${status})`, target: next.id })
      showToast({ text: status === 'live' ? 'Banner published.' : status === 'paused' ? 'Banner paused.' : 'Banner draft saved.', expression: 'celebrating' })
      navigate('/bitinarydev/banners')
    } catch (reason) {
      showToast({ text: reason instanceof Error ? `Couldn’t save the banner: ${reason.message}` : 'Couldn’t save the banner. Please try again.', expression: 'unsure' })
    } finally {
      setSaving(false)
    }
  }
  const duplicate = () => {
    const copy = { ...b, id: `bn-${Date.now()}`, name: `${b.name || b.title} (copy)`, status: 'draft' as const, stats: { views: 0, clicks: 0 } }
    update((x) => ({ ...x, banners: [...x.banners, copy] }), { area: 'Banners', action: `Duplicated "${b.name}"` })
    navigate(`/bitinarydev/banners/${copy.id}`)
  }
  const remove = () => {
    update((x) => ({ ...x, banners: x.banners.filter((y) => y.id !== b.id) }), { area: 'Banners', action: `Deleted "${b.name}"` })
    navigate('/bitinarydev/banners')
  }

  return (
    <>
      <Link to="/bitinarydev/banners" className="mb-3 inline-flex min-h-11 items-center gap-1.5 font-display text-[14px] font-medium text-link">
        <ArrowLeft size={17} /> All banners
      </Link>
      <PageHead
        title={existing ? 'Edit banner' : 'New banner'}
        actions={
          <>
            {existing && (
              <>
                <Button variant="ghost" icon={<Copy size={17} />} onClick={duplicate}>
                  Duplicate
                </Button>
                <Button variant="ghost" icon={<Trash2 size={17} />} onClick={() => setDel(true)}>
                  Delete
                </Button>
              </>
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="space-y-4">
          <Panel title="Where it shows">
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Placement">
              {PLACEMENTS.map((p) => (
                <button key={p.id} role="radio" aria-checked={b.placement === p.id} onClick={() => set({ placement: p.id })} className={cn('flex flex-col items-start rounded-[16px] border-2 p-3 text-left', b.placement === p.id ? 'border-primary bg-primary/8' : 'border-line')}>
                  <span className="font-display text-[15px] font-semibold">{p.label}</span>
                  <span className="text-[13px] text-fg-2">{p.where}</span>
                </button>
              ))}
            </div>
          </Panel>

          {b.placement === 'home-carousel' && (
            <Panel title="Slide style" sub="Image slides fill the carousel box exactly. Put any text inside the image.">
              <Segmented
                className="w-full"
                label="Slide style"
                value={b.style ?? 'promo'}
                onChange={(style) => set({ style })}
                options={[
                  { value: 'promo', label: 'Text + photo' },
                  { value: 'image', label: 'Image only' },
                ]}
              />
            </Panel>
          )}
          {b.placement === 'home-carousel' && b.style === 'image' && <ImageSlideEditor b={b} set={set} errors={tried ? errors : {}} />}

          <Panel title="Content">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="bn-title" error={tried ? errors.title : undefined} hint={b.style === 'image' && b.placement === 'home-carousel' ? `${b.title.length}/60 · Shown if the image can't load` : `${b.title.length}/60`} className="sm:col-span-2">
                <input id="bn-title" value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="Libreng kape sa ₱300 pataas" className={cn(field, tried && errors.title && 'border-danger')} />
              </Field>
              <Field label="Subtitle" htmlFor="bn-sub" className="sm:col-span-2">
                <input id="bn-sub" value={b.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Kapihan sa Kalye Real" className={field} />
              </Field>
              <Field label="Button label" htmlFor="bn-cta" error={tried ? errors.cta : undefined}>
                <input id="bn-cta" value={b.cta} onChange={(e) => set({ cta: e.target.value })} placeholder="Kunin ang deal" className={cn(field, tried && errors.cta && 'border-danger')} />
              </Field>
              <Field label="Tag text" htmlFor="bn-label" hint="Optional, e.g. Hanggang Nob 30">
                <input id="bn-label" value={b.label ?? ''} onChange={(e) => set({ label: e.target.value || undefined })} className={field} />
              </Field>
              <Field label="Internal name" htmlFor="bn-name" hint="Only the team sees this">
                <input id="bn-name" value={b.name} onChange={(e) => set({ name: e.target.value })} placeholder={b.title || 'Pasko promo 2026'} className={field} />
              </Field>
              <Field label="Color">
                <Segmented
                  className="w-full"
                  label="Color"
                  value={b.tone}
                  onChange={(tone) => set({ tone })}
                  options={[
                    { value: 'orange', label: 'Orange' },
                    { value: 'brown', label: 'Brown' },
                    { value: 'amber', label: 'Amber' },
                  ]}
                />
              </Field>
            </div>
            <div className={cn('mt-4', b.placement === 'home-carousel' && b.style === 'image' && 'hidden')}>
              <p className="mb-1.5 font-display text-[14px] font-medium">Image</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-[12px] border-2 border-dashed border-primary/50 text-link">
                  <ImagePlus size={20} />
                  <span className="text-[11px] font-semibold">Upload</span>
                </button>
                <button onClick={() => set({ image: undefined })} aria-pressed={!b.image} className={cn('h-16 w-16 rounded-[12px] border-2 text-[12px] font-semibold text-fg-2', !b.image ? 'border-primary' : 'border-line')}>
                  None
                </button>
                {b.image?.startsWith('data:') && <img src={b.image} alt="Uploaded" className="h-16 w-16 rounded-[12px] border-2 border-primary object-cover" />}
                {IMAGES.map((im) => (
                  <button key={im} onClick={() => set({ image: im })} aria-pressed={b.image === im} aria-label="Use this photo" className={cn('h-16 w-16 overflow-hidden rounded-[12px] border-2', b.image === im ? 'border-primary' : 'border-transparent')}>
                    <img src={src(im, 120, 120)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) set({ image: await shrink(f, 1000) })
                  e.target.value = ''
                }}
              />
            </div>
          </Panel>

          <Panel title="Link">
            <Segmented
              className="w-full"
              label="Link type"
              value={b.link.kind}
              onChange={(kind) => set({ link: kind === 'place' ? { kind, placeId: places[0].id } : kind === 'route' ? { kind, path: '/search' } : { kind, url: 'https://' } })}
              options={[
                { value: 'place', label: 'Business' },
                { value: 'route', label: 'App page' },
                { value: 'url', label: 'Website' },
              ]}
            />
            <div className="mt-3">
              {b.link.kind === 'place' && (
                <select aria-label="Business" value={b.link.placeId} onChange={(e) => set({ link: { kind: 'place', placeId: e.target.value }, sponsor: e.target.value })} className={field}>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.area}
                    </option>
                  ))}
                </select>
              )}
              {b.link.kind === 'route' && <input aria-label="App page" value={b.link.path} onChange={(e) => set({ link: { kind: 'route', path: e.target.value } })} placeholder="/search?cat=Kapihan" className={cn(field, tried && errors.link && 'border-danger')} />}
              {b.link.kind === 'url' && <input aria-label="Website" type="url" value={b.link.url} onChange={(e) => set({ link: { kind: 'url', url: e.target.value } })} placeholder="https://" className={cn(field, tried && errors.link && 'border-danger')} />}
              {tried && errors.link && <p className="mt-1 text-[13px] font-semibold text-danger">{errors.link}</p>}
              {hiddenTarget && (
                <p className="mt-2 flex items-center gap-2 rounded-[12px] bg-caution-bg px-3 py-2 text-[13px] font-semibold text-caution">
                  <TriangleAlert size={16} /> This business is hidden from the app, so the banner won't show.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Audience and schedule">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Who sees it" className="sm:col-span-2">
                <Segmented
                  className="w-full"
                  label="Audience"
                  value={b.audience}
                  onChange={(audience: Audience) => set({ audience })}
                  options={[
                    { value: 'all', label: 'Everyone' },
                    { value: 'guests', label: 'Guests' },
                    { value: 'travelers', label: 'Travelers' },
                    { value: 'business', label: 'Owners' },
                  ]}
                />
              </Field>
              <Field label="Start date" htmlFor="bn-start" hint="Empty = starts now">
                <input id="bn-start" type="date" value={b.start ?? ''} onChange={(e) => set({ start: e.target.value || undefined })} className={field} />
              </Field>
              <Field label="End date" htmlFor="bn-end" hint="Empty = no end" error={tried ? errors.end : undefined}>
                <input id="bn-end" type="date" value={b.end ?? ''} onChange={(e) => set({ end: e.target.value || undefined })} className={cn(field, tried && errors.end && 'border-danger')} />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Panel title="Live preview" sub={`${placementLabel(b.placement)} · phone width`}>
            <div className="space-y-3">
              {(['light', 'dark'] as const).map((m) => (
                <div key={m} data-theme={m} className="rounded-[18px] bg-bg p-3 text-fg" data-scope={m === 'light' ? 'light' : undefined}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-2">{m}</p>
                  <div className="mx-auto max-w-[360px] [&_.mx-4]:mx-0">
                    <BannerPreview banner={{ ...b, title: b.title || 'Banner title', cta: b.cta || 'Button' }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="card flex flex-wrap gap-2 p-4">
            <Button variant="secondary" icon={<Save size={17} />} disabled={saving} onClick={() => void save(existing?.status === 'paused' ? 'paused' : 'draft')}>
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
            {existing?.status === 'live' && (
              <Button variant="secondary" icon={<Pause size={17} />} disabled={saving} onClick={() => void save('paused')}>
                Pause
              </Button>
            )}
            <Button className="flex-1" icon={<Send size={17} />} disabled={saving} onClick={() => void save('live')}>
              {existing?.status === 'live' ? 'Save and keep live' : 'Publish'}
            </Button>
            {tried && Object.keys(errors).length > 0 && <p className="w-full text-[13px] font-semibold text-danger">Fix the highlighted fields first.</p>}
          </div>
        </div>
      </div>
      <IOSAlert
        open={del}
        title="Delete this banner?"
        message="It disappears from the app right away."
        actions={[
          { label: 'Cancel', onClick: () => setDel(false) },
          { label: 'Delete', destructive: true, bold: true, onClick: () => (setDel(false), remove()) },
        ]}
      />
    </>
  )
}

/* ------------------------------ Image slide editor ------------------------------ */

const PHONE = { w: 358, h: 168 }
const DESKTOP = { w: 1000, h: 168 }

function ImageSlideEditor({ b, set, errors }: { b: Banner; set: (p: Partial<Banner>) => void; errors: Record<string, string> }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [tooBig, setTooBig] = useState(false)
  const f = b.focus ?? { x: 50, y: 50 }
  const url = b.image ? src(b.image, 1600) : undefined
  useEffect(() => {
    if (!url) return setSize(null)
    const im = new Image()
    im.onload = () => setSize({ w: im.naturalWidth, h: im.naturalHeight })
    im.src = url
  }, [url])
  const pickFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    set({ focus: { x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) } })
  }
  const small = size && (size.w < 1200 || size.w / size.h < 2)
  const crop = (box: { w: number; h: number }, label: string, className: string) => (
    <div className={className}>
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-fg-2">
        {label} · {box.w}×{box.h}
      </p>
      <div className="relative w-full overflow-hidden rounded-[14px] bg-sunken ring-2 ring-primary/60 dark:bg-elevated" style={{ aspectRatio: `${box.w} / ${box.h}` }}>
        {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${f.x}% ${f.y}%` }} />}
      </div>
    </div>
  )
  return (
    <Panel title="Image slide" sub="Recommended 1600×600 (JPG, PNG or WebP, up to 10 MB). Keep text and faces near the middle.">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" icon={<ImagePlus size={17} />} onClick={() => fileRef.current?.click()}>
          {b.image ? 'Replace image' : 'Upload image'}
        </Button>
        {IMAGES.slice(0, 8).map((im) => (
          <button key={im} onClick={() => set({ image: im })} aria-pressed={b.image === im} aria-label="Use this photo" className={cn('h-11 w-16 overflow-hidden rounded-[10px] border-2', b.image === im ? 'border-primary' : 'border-transparent')}>
            <img src={src(im, 160, 110)} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (file.size > 10 * 1024 * 1024) return setTooBig(true)
            setTooBig(false)
            set({ image: await shrink(file, 1600), focus: { x: 50, y: 50 } })
          }}
        />
      </div>
      {(tooBig || errors.image) && <p className="mt-2 text-[13px] font-semibold text-danger">{tooBig ? 'That image is over 10 MB. Use a smaller file.' : errors.image}</p>}

      {url && (
        <>
          <p className="mb-1.5 mt-4 font-display text-[14px] font-medium">Focus point</p>
          <p className="mb-2 text-[13px] text-fg-2">Click the part that must always stay visible. The crop keeps it in view on every screen.</p>
          <div onClick={pickFocus} className="relative mx-auto w-full max-w-[560px] cursor-crosshair overflow-hidden rounded-[14px]" role="img" aria-label={`Focus at ${f.x}% across, ${f.y}% down`}>
            <img src={url} alt="" className="block w-full select-none" draggable={false} />
            <span className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.45)]" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium">
              Across ({f.x}%)
              <input type="range" min={0} max={100} value={f.x} onChange={(e) => set({ focus: { ...f, x: Number(e.target.value) } })} className="mt-1 w-full accent-[#FF6A00]" />
            </label>
            <label className="text-[13px] font-medium">
              Down ({f.y}%)
              <input type="range" min={0} max={100} value={f.y} onChange={(e) => set({ focus: { ...f, y: Number(e.target.value) } })} className="mt-1 w-full accent-[#FF6A00]" />
            </label>
          </div>
          {size && (
            <p className={cn('mt-3 flex items-center gap-2 text-[13px]', small ? 'font-semibold text-caution' : 'text-fg-2')}>
              {small && <TriangleAlert size={15} />}
              {size.w}×{size.h}px{small ? ' · Smaller or taller than recommended, so it may look soft or crop a lot on desktop.' : ' · Good size'}
            </p>
          )}
          <div className="mt-4 grid gap-4">
            {crop(PHONE, 'Phone', 'max-w-[358px]')}
            {crop(DESKTOP, 'Desktop', 'w-full')}
          </div>
        </>
      )}

      <Field label="Alt text" htmlFor="bn-alt" error={errors.alt} hint={`${b.alt?.length ?? 0}/120 · Read aloud by screen readers, e.g. "Pasko promo: 20% off sa lechon"`} className="mt-4">
        <input id="bn-alt" value={b.alt ?? ''} onChange={(e) => set({ alt: e.target.value })} className={cn(field, errors.alt && 'border-danger')} />
      </Field>
    </Panel>
  )
}
