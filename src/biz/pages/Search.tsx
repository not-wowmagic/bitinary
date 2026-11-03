import { ArrowLeft, BadgeCheck, BookOpen, CalendarDays, ChevronRight, Clock, MessageCircle, Search as SearchGlyph, Star, Tag, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { bizTypeOpts, label } from '@/data/themes'
import { cn } from '@/lib/cn'
import { useOnline } from '@/lib/useOnline'
import { usePersistentState } from '@/lib/usePersistentState'
import { longDate, relTime } from '../format'
import { directory, helps, programs } from '../seed'
import { useBiz } from '../store'
import { Card, PageHeader, Pill, StateBlock } from '../ui'

type Scope = 'mine' | 'biz' | 'programs' | 'help'

function FilterSelect({ label: l, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className={cn('relative inline-flex min-h-11 shrink-0 items-center rounded-full border-2 pl-4 pr-9 font-display text-[14px] font-medium', value ? 'border-primary bg-primary/10' : 'border-line bg-surface')}>
      <span className="sr-only">{l}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent pr-1 outline-none" aria-label={l}>
        <option value="">{l}</option>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <ChevronRight size={16} className="pointer-events-none absolute right-3 rotate-90" />
    </label>
  )
}

export function BizSearch() {
  const { d, t, lang } = useBiz()
  const navigate = useNavigate()
  const online = useOnline()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const scope = (params.get('scope') as Scope) ?? 'mine'
  const [text, setText] = useState(q)
  const [f, setF] = useState({ cat: '', area: '', date: '', status: '' })
  const [recent, setRecent] = usePersistentState<string[]>('biz-recent', [])
  const setQ = (v: string, s: Scope = scope) => {
    setParams({ q: v, scope: s }, { replace: true })
    if (v.trim()) setRecent((r) => [v.trim(), ...r.filter((x) => x !== v.trim())].slice(0, 6))
  }
  const has = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase())
  const inDate = (iso: string) => !f.date || (f.date === '7' ? Date.now() - new Date(iso).getTime() < 7 * 864e5 : Date.now() - new Date(iso).getTime() < 30 * 864e5)

  const mine = useMemo(() => {
    if (!q) return []
    const rows: { id: string; kind: string; title: string; sub: string; at: string; to: string; status: string }[] = []
    d.posts.filter((p) => has(p.text + (p.title ?? ''))).forEach((p) => rows.push({ id: p.id, kind: p.type === 'reel' ? 'Reel' : p.type === 'blog' ? 'Blog' : 'Post', title: p.title ?? p.text, sub: `${p.views} views · ${p.comments} ${t('komento', 'comments')}`, at: p.at, to: `/biz/content/edit/${p.id}`, status: p.status }))
    d.reviews.filter((r) => has(r.text + r.nick)).forEach((r) => rows.push({ id: r.id, kind: t('Review', 'Review'), title: r.text, sub: `${r.stars}★ · ${r.nick}`, at: r.at, to: `/biz/content/reviews/${r.id}`, status: r.reply ? 'replied' : 'needs' }))
    d.comments.filter((c) => has(c.text + c.nick)).forEach((c) => rows.push({ id: c.id, kind: t('Komento', 'Comment'), title: c.text, sub: c.nick, at: c.at, to: `/biz/content/comments?focus=${c.id}`, status: c.hidden ? 'hidden' : c.reply ? 'replied' : 'needs' }))
    d.deals.filter((x) => has(x.item + x.code)).forEach((x) => rows.push({ id: x.id, kind: 'Deal', title: `${x.kind === 'b1t1' ? 'Buy 1 Take 1' : x.kind === 'discount' ? `${x.percent}% off` : 'Free add-on'} · ${x.item}`, sub: x.code, at: new Date(x.start).toISOString(), to: '/biz/account/deals', status: x.status }))
    return rows.filter((r) => inDate(r.at) && (!f.status || r.status === f.status))
  }, [q, d, f]) // eslint-disable-line react-hooks/exhaustive-deps
  const bizRows = directory.filter((x) => (!q || has(x.name + x.area)) && (!f.cat || x.type === f.cat) && (!f.area || x.area === f.area) && (!f.status || (f.status === 'verified' ? x.verified : !x.verified)))
  const progRows = programs.filter((x) => (!q || has(x.en + x.org + x.area)) && (!f.cat || x.kind === f.cat) && (!f.date || new Date(x.when).getTime() - Date.now() < Number(f.date) * 864e5))
  const helpRows = helps.filter((x) => !q || has(x[lang] + x.bodyEn + x.bodyTl))
  const count = { mine: mine.length, biz: bizRows.length, programs: progRows.length, help: helpRows.length }
  const scopes: [Scope, string][] = [
    ['mine', t('Sarili kong nilalaman', 'My content')],
    ['biz', t('Mga negosyo', 'Businesses')],
    ['programs', t('Programa at event', 'Programs and events')],
    ['help', t('Tulong', 'Help')],
  ]
  const showResults = !!q || scope !== 'mine'
  const empty = showResults && count[scope] === 0

  return (
    <main>
      <PageHeader title={t('Hanapin', 'Search')} phase="MVP" sub={t('Hanapin ang sarili mong nilalaman, ibang negosyo, programa at tulong.', 'Search your content, other businesses, programs and help.')} />
      <div className="space-y-4 px-4 md:px-8">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            setQ(text)
          }}
          className="relative"
        >
          <SearchGlyph size={22} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-link" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Hanapin ang post, review, negosyo o programa…', 'Search posts, reviews, businesses or programs…')} aria-label={t('Hanapin', 'Search')} className="h-16 w-full rounded-[22px] border-2 border-line bg-surface pl-14 pr-14 text-[18px] shadow-card outline-none focus:border-primary" />
          {text && (
            <button type="button" aria-label={t('Burahin', 'Clear')} onClick={() => (setText(''), setQ(''))} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-fg-2">
              <X size={20} />
            </button>
          )}
        </form>

        <div role="tablist" aria-label={t('Saklaw', 'Scope')} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {scopes.map(([s, l]) => (
            <button key={s} role="tab" aria-selected={scope === s} onClick={() => setQ(q, s)} className={cn('flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 font-display text-[15px] font-medium', scope === s ? 'bg-primary text-on-primary' : 'bg-sunken text-fg-2 dark:bg-elevated')}>
              {l}
              {showResults && <span className={cn('rounded-full px-1.5 text-[12px]', scope === s ? 'bg-ink/15' : 'bg-surface')}>{count[s]}</span>}
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {(scope === 'biz' || scope === 'programs') && (
            <FilterSelect label={t('Kategorya', 'Category')} value={f.cat} onChange={(v) => setF({ ...f, cat: v })} options={scope === 'biz' ? bizTypeOpts.map((o) => [o.id, o[lang]]) : [['training', 'Training'], ['grant', 'Grant'], ['event', 'Event'], ['festival', 'Festival']]} />
          )}
          {scope === 'biz' && <FilterSelect label={t('Lugar', 'Area')} value={f.area} onChange={(v) => setF({ ...f, area: v })} options={[...new Set(directory.map((x) => x.area))].map((a) => [a, a])} />}
          {scope !== 'help' && <FilterSelect label={t('Petsa', 'Date')} value={f.date} onChange={(v) => setF({ ...f, date: v })} options={[['7', t('Huling/Susunod na 7 araw', 'Last/next 7 days')], ['30', t('30 araw', '30 days')]]} />}
          {scope === 'mine' && <FilterSelect label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[['needs', t('Kailangang sagutin', 'Needs reply')], ['replied', t('Nasagot na', 'Replied')], ['published', t('Na-publish', 'Published')], ['scheduled', t('Naka-schedule', 'Scheduled')], ['draft', 'Draft'], ['hidden', t('Nakatago', 'Hidden')]]} />}
          {scope === 'biz' && <FilterSelect label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[['verified', t('Na-verify', 'Verified')], ['unverified', t('Hindi pa na-verify', 'Not yet verified')]]} />}
        </div>

        {!online ? (
          <Card>
            <StateBlock pose="sleeping" placeholder title={t('Offline ka', "You're offline")} body={t('Kailangan ng internet para maghanap. Subukan ulit kapag may signal na.', 'Search needs the internet. Try again when you have signal.')} action={t('Subukan ulit', 'Try again')} onAction={() => location.reload()} />
          </Card>
        ) : !showResults ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={t('Kamakailang hinanap', 'Recent searches')} icon={<Clock size={20} />}>
              {recent.length ? (
                <ul className="divide-y divide-line">
                  {recent.map((r) => (
                    <li key={r} className="flex items-center">
                      <button onClick={() => (setText(r), setQ(r))} className="flex min-h-12 flex-1 items-center gap-3 text-left text-[16px]">
                        <Clock size={18} className="text-muted" /> {r}
                      </button>
                      <button aria-label={t(`Tanggalin ang ${r}`, `Remove ${r}`)} onClick={() => setRecent((x) => x.filter((y) => y !== r))} className="flex h-11 w-11 items-center justify-center text-fg-2">
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[15px] text-fg-2">{t('Wala pa.', 'None yet.')}</p>
              )}
            </Card>
            <Card>
              <StateBlock className="py-4" pose="pointing" title={t('Ano ang hahanapin natin?', 'What should we look for?')} body={t('Subukan ang "kare-kare", "Food Fest" o "verification".', 'Try "kare-kare", "Food Fest" or "verification".')} />
            </Card>
          </div>
        ) : empty ? (
          <Card>
            <StateBlock pose="unsure" placeholder title={t('Walang nahanap', 'No results')} body={t(`Walang tugma sa "${q}". Subukan ang ibang salita o tanggalin ang filter.`, `Nothing matches "${q}". Try another word or remove a filter.`)} action={t('Tanggalin ang filter', 'Clear filters')} onAction={() => setF({ cat: '', area: '', date: '', status: '' })} />
          </Card>
        ) : (
          <Card className="p-0 md:p-0">
            {scope === 'mine' && (
              <ul className="divide-y divide-line">
                {mine.map((r) => (
                  <li key={r.kind + r.id}>
                    <button onClick={() => navigate(r.to)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/60">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-elevated">{r.kind === 'Deal' ? <Tag size={18} /> : r.kind.startsWith('Re') && r.kind !== 'Reel' ? <Star size={18} /> : <MessageCircle size={18} />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-semibold">{r.title}</span>
                        <span className="text-[14px] text-fg-2">
                          {r.kind} · {r.sub} · {relTime(r.at, lang)}
                        </span>
                      </span>
                      <ChevronRight size={18} className="text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {scope === 'biz' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[15px]">
                  <thead className="text-[13px] text-fg-2">
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 font-medium">{t('Pangalan', 'Name')}</th>
                      <th className="px-2 py-3 font-medium">{t('Kategorya', 'Category')}</th>
                      <th className="px-2 py-3 font-medium">{t('Lugar', 'Area')}</th>
                      <th className="px-2 py-3 font-medium">{t('Presyo', 'Price')}</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bizRows.map((x) => (
                      <tr key={x.id} onClick={() => navigate(`/biz/search/business/${x.id}`)} className="cursor-pointer border-b border-line last:border-0 hover:bg-sunken/60">
                        <td className="px-4 py-3 font-semibold">
                          <button className="text-left" onClick={() => navigate(`/biz/search/business/${x.id}`)}>
                            {x.name}
                          </button>
                        </td>
                        <td className="px-2 py-3">{label(bizTypeOpts, x.type, lang)}</td>
                        <td className="px-2 py-3">{x.area}</td>
                        <td className="px-2 py-3 font-display">{x.price}</td>
                        <td className="px-4 py-3">{x.verified ? <Pill tone="ok">{t('Na-verify', 'Verified')}</Pill> : <Pill tone="caution">{t('Hindi pa na-verify', 'Not yet verified')}</Pill>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {scope === 'programs' && (
              <ul className="divide-y divide-line">
                {progRows.map((x) => (
                  <li key={x.id}>
                    <button onClick={() => navigate(`/biz/search/program/${x.id}`)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/60">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-elevated">
                        <CalendarDays size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold">{x[lang]}</span>
                        <span className="text-[14px] text-fg-2">
                          {x.org} · {longDate(x.when, lang)} · {x.area}
                        </span>
                      </span>
                      <Pill tone="orange">{x.kind}</Pill>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {scope === 'help' && (
              <ul className="divide-y divide-line">
                {helpRows.map((x) => (
                  <li key={x.id}>
                    <button onClick={() => navigate(`/biz/search/help/${x.id}`)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/60">
                      <BookOpen size={20} className="shrink-0 text-link" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold">{x[lang]}</span>
                        <span className="line-clamp-1 text-[14px] text-fg-2">{lang === 'en' ? x.bodyEn : x.bodyTl}</span>
                      </span>
                      <ChevronRight size={18} className="text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </main>
  )
}

function DetailShell({ title, children, phase }: { title: string; children: React.ReactNode; phase?: 'MVP' | 'P2' | 'P3' }) {
  const { t } = useBiz()
  const navigate = useNavigate()
  return (
    <main>
      <div className="px-4 pt-4 md:px-8">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>
          {t('Bumalik', 'Back')}
        </Button>
      </div>
      <PageHeader title={title} phase={phase} className="pt-1 md:pt-2" />
      <div className="max-w-[860px] space-y-4 px-4 md:px-8">{children}</div>
    </main>
  )
}

export function DirectoryDetail() {
  const { id } = useParams()
  const { t, lang } = useBiz()
  const x = directory.find((y) => y.id === id)
  if (!x) return <StateBlock pose="unsure" placeholder title={t('Hindi nahanap', 'Not found')} />
  return (
    <DetailShell title={x.name} phase="MVP">
      <Card>
        <dl className="divide-y divide-line text-[16px]">
          {[
            [t('Kategorya', 'Category'), label(bizTypeOpts, x.type, lang)],
            [t('Lugar', 'Area'), x.area],
            [t('Price range', 'Price range'), x.price],
            ['Status', x.verified ? t('Na-verify', 'Verified') : t('Hindi pa na-verify', 'Not yet verified')],
            [t('Nasa Bitinary mula', 'On Bitinary since'), x.since],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-3">
              <dt className="text-fg-2">{k}</dt>
              <dd className="flex items-center gap-1.5 font-semibold">
                {k === 'Status' && x.verified && <BadgeCheck size={18} className="text-ok" />}
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <p className="text-[15px] text-fg-2">{t('Pampublikong directory lang ito. Hindi ipinapakita ang stats ng ibang negosyo.', 'This is a public directory entry. Other businesses’ stats are never shown.')}</p>
    </DetailShell>
  )
}

export function ProgramDetail() {
  const { id } = useParams()
  const { t, lang, showToast } = useBiz()
  const [joined, setJoined] = useState(false)
  const x = programs.find((y) => y.id === id)
  if (!x) return <StateBlock pose="unsure" placeholder title={t('Hindi nahanap', 'Not found')} />
  return (
    <DetailShell title={x[lang]} phase="P3">
      <Card>
        <p className="text-body">{lang === 'en' ? x.bodyEn : x.bodyTl}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [t('Organizer', 'Organizer'), x.org],
            [t('Petsa', 'Date'), longDate(x.when, lang)],
            [t('Lugar', 'Area'), x.area],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[14px] bg-sunken p-3 dark:bg-elevated">
              <dt className="text-[13px] text-fg-2">{k}</dt>
              <dd className="font-display text-[16px] font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <Button size="lg" className="mt-5" disabled={joined} onClick={() => (setJoined(true), showToast({ text: t('Naitala ang interes mo. Makikipag-ugnayan ang organizer.', 'Interest recorded. The organizer will contact you.'), expression: 'celebrating' }))}>
          {joined ? t('Interesado ka na', "You're interested") : t('Interesado ako', "I'm interested")}
        </Button>
      </Card>
    </DetailShell>
  )
}

export function HelpDetail() {
  const { id } = useParams()
  const { t, lang } = useBiz()
  const navigate = useNavigate()
  const x = helps.find((y) => y.id === id)
  if (!x) return <StateBlock pose="unsure" placeholder title={t('Hindi nahanap', 'Not found')} />
  return (
    <DetailShell title={x[lang]} phase="MVP">
      <Card>
        <p className="text-body leading-relaxed">{lang === 'en' ? x.bodyEn : x.bodyTl}</p>
      </Card>
      <Button variant="secondary" onClick={() => navigate('/biz/account/help')}>
        {t('Kausapin ang Bitinary team', 'Get help from the Bitinary team')}
      </Button>
    </DetailShell>
  )
}
