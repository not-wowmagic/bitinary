import { ArrowRight, ExternalLink, Monitor, Play, Smartphone, Sparkles, Tablet } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { PhaseTag, setNotes, useNotes } from '@/components/ui/PhaseTag'
import { Segmented } from '@/components/ui/Segmented'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { useBiz } from './store'

type Phase = 'MVP' | 'P2' | 'P3'
type Device = 'mobile' | 'tablet' | 'desktop'
type Entry = { name: string; path: string; phase: Phase; devices?: Device[] }
const ALL: Device[] = ['desktop', 'tablet', 'mobile']
const DM: Device[] = ['desktop', 'mobile']

const groups: { title: string; items: Entry[] }[] = [
  {
    title: 'Sign-up and go live',
    items: [
      { name: 'Language picker', path: '/biz/language', phase: 'MVP', devices: DM },
      { name: 'Welcome (Hello fox)', path: '/biz/welcome', phase: 'MVP', devices: DM },
      { name: 'Method (Google, +63, email)', path: '/biz/auth?mode=signup', phase: 'MVP', devices: DM },
      { name: 'Verify code', path: '/biz/auth/verify?via=mobile&to=9171234500', phase: 'MVP', devices: DM },
      { name: 'Verify · wrong code', path: '/biz/auth/verify?via=mobile&to=9171234500&state=wrong', phase: 'MVP', devices: DM },
      { name: 'Verify · too many attempts', path: '/biz/auth/verify?via=mobile&to=9171234500&state=locked', phase: 'MVP', devices: DM },
      { name: 'Name and nickname', path: '/biz/signup/name', phase: 'MVP', devices: DM },
      { name: 'Account ready', path: '/biz/signup/ready', phase: 'MVP', devices: DM },
      { name: 'Business hub (new)', path: '/biz/setup?state=fresh', phase: 'MVP', devices: ALL },
      { name: 'Business hub · ready to go live', path: '/biz/setup?state=setup-ready', phase: 'MVP', devices: ALL },
      { name: 'Required · Basics', path: '/biz/setup/basics?state=fresh', phase: 'MVP', devices: DM },
      { name: 'Required · Location', path: '/biz/setup/location?state=fresh', phase: 'MVP', devices: DM },
      { name: 'Required · Opening hours', path: '/biz/setup/hours?state=fresh', phase: 'MVP', devices: DM },
      { name: 'Required · Contact', path: '/biz/setup/contact?state=fresh', phase: 'MVP', devices: DM },
      { name: 'Required field error', path: '/biz/setup/basics?state=error', phase: 'MVP', devices: DM },
      { name: 'Summary checklist', path: '/biz/setup/summary?state=setup-ready', phase: 'MVP', devices: DM },
      { name: 'Go live (Celebrate)', path: '/biz/live', phase: 'MVP', devices: DM },
    ],
  },
  {
    title: 'Statistics',
    items: [
      { name: 'Overview · pending verification', path: '/biz/stats', phase: 'MVP', devices: ALL },
      { name: 'Overview · not yet verified', path: '/biz/stats?state=unverified', phase: 'MVP', devices: ALL },
      { name: 'Overview · more documents needed', path: '/biz/stats?state=needs-docs', phase: 'MVP', devices: DM },
      { name: 'Overview · verified', path: '/biz/stats?state=verified', phase: 'MVP', devices: DM },
      { name: 'Overview · draft', path: '/biz/stats?state=draft', phase: 'MVP', devices: DM },
      { name: 'Analytics', path: '/biz/stats/analytics?state=verified', phase: 'P2', devices: ALL },
      { name: 'Analytics · loading', path: '/biz/stats/analytics?state=loading', phase: 'P2', devices: DM },
      { name: 'Analytics · error', path: '/biz/stats/analytics?state=error', phase: 'P2', devices: DM },
      { name: 'Analytics · not enough data', path: '/biz/stats/analytics?state=nodata', phase: 'P2', devices: DM },
      { name: 'Backgrounds', path: '/biz/stats/backgrounds', phase: 'MVP', devices: DM },
      { name: 'Backgrounds · verification', path: '/biz/stats/backgrounds?state=needs-docs#verify', phase: 'MVP', devices: DM },
    ],
  },
  {
    title: 'Jimbot',
    items: [
      { name: 'Jimbot · suggestion with actions', path: '/biz/jimbot?state=sample', phase: 'P2', devices: ALL },
      { name: 'Jimbot · new chat', path: '/biz/jimbot', phase: 'P2', devices: DM },
      { name: 'Jimbot · not enough data', path: '/biz/jimbot?state=nodata', phase: 'P2', devices: DM },
    ],
  },
  {
    title: 'Search',
    items: [
      { name: 'Search · start', path: '/biz/search', phase: 'MVP', devices: DM },
      { name: 'Search · my content', path: '/biz/search?q=kare&scope=mine', phase: 'MVP', devices: DM },
      { name: 'Search · businesses (table)', path: '/biz/search?q=&scope=biz', phase: 'MVP', devices: DM },
      { name: 'Search · programs and events', path: '/biz/search?q=&scope=programs', phase: 'P3', devices: DM },
      { name: 'Search · no results', path: '/biz/search?q=boracay&scope=mine', phase: 'MVP', devices: DM },
      { name: 'Search · offline', path: '/biz/search?state=offline', phase: 'MVP', devices: DM },
      { name: 'Program detail', path: '/biz/search/program/pr1', phase: 'P3', devices: DM },
    ],
  },
  {
    title: 'Blog and Social',
    items: [
      { name: 'Posts · list', path: '/biz/content', phase: 'P3', devices: DM },
      { name: 'Posts · calendar', path: '/biz/content?v=calendar', phase: 'P3', devices: DM },
      { name: 'Posts · empty', path: '/biz/content?state=empty', phase: 'P3', devices: DM },
      { name: 'Composer · post', path: '/biz/content/new?type=post', phase: 'P3', devices: DM },
      { name: 'Composer · reel', path: '/biz/content/new?type=reel', phase: 'P3', devices: DM },
      { name: 'Composer · reel camera permission', path: '/biz/content/new?type=reel&state=permission', phase: 'P3', devices: DM },
      { name: 'Composer · blog', path: '/biz/content/new?type=blog', phase: 'P3', devices: DM },
      { name: 'Comments', path: '/biz/content/comments', phase: 'P3', devices: DM },
      { name: 'Reviews · list', path: '/biz/content/reviews', phase: 'P3', devices: ALL },
      { name: 'Reviews · reply with Jimbot', path: '/biz/content/reviews/r2?draft=1', phase: 'P3', devices: ALL },
      { name: 'Report · step 1 reason', path: '/biz/content/reviews/r6?state=report', phase: 'P3', devices: DM },
      { name: 'Report · step 2 explanation', path: '/biz/content/reviews/r6?state=report-2', phase: 'P3', devices: DM },
      { name: 'Report · step 5 submit', path: '/biz/content/reviews/r6?state=report-5', phase: 'P3', devices: DM },
      { name: 'Case tracking · list', path: '/biz/content/reviews/cases', phase: 'P3', devices: DM },
      { name: 'Case · under review', path: '/biz/content/reviews/cases/BTN-2026-0142', phase: 'P3', devices: DM },
      { name: 'Case · kept, appealable', path: '/biz/content/reviews/cases/BTN-2026-0098', phase: 'P3', devices: DM },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Account', path: '/biz/account', phase: 'MVP', devices: DM },
      { name: 'Profile', path: '/biz/account/profile', phase: 'MVP', devices: DM },
      { name: 'Branches, staff and permissions', path: '/biz/account/team', phase: 'MVP', devices: DM },
      { name: 'QR Check-in kit', path: '/biz/account/qr', phase: 'MVP', devices: DM },
      { name: 'Deals · locked', path: '/biz/account/deals?state=unverified', phase: 'P2', devices: DM },
      { name: 'Deals · builder', path: '/biz/account/deals?state=verified&new=b1t1', phase: 'P2', devices: DM },
      { name: 'Boost', path: '/biz/account/boost?state=verified', phase: 'P2', devices: DM },
      { name: 'Reservations and queue', path: '/biz/account/reservations?state=verified', phase: 'P2', devices: DM },
      { name: 'Plan and billing', path: '/biz/account/billing', phase: 'P2', devices: DM },
      { name: 'Preferences', path: '/biz/account/preferences', phase: 'MVP', devices: DM },
      { name: 'Help and support', path: '/biz/account/help', phase: 'MVP', devices: DM },
    ],
  },
]

const dims = { mobile: { w: 390, h: 844, frame: 270 }, tablet: { w: 768, h: 1024, frame: 400 }, desktop: { w: 1280, h: 800, frame: 640 } }
const path = ['Language picker', 'Sign-up', 'Business hub', '4 required themes', 'Summary', 'Go live', 'Overview', 'Quick Update', 'Analytics', 'Jimbot suggestion', 'Blog and Social', 'Comments', 'Reviews', 'Report false review', 'Case tracking', 'Account', 'QR kit']

function Frame({ p, theme, device, lang }: { p: string; theme: 'light' | 'dark'; device: Device; lang: 'en' | 'tl' }) {
  const d = dims[device]
  const scale = d.frame / d.w
  const [base, hash] = p.split('#')
  const src = `${import.meta.env.BASE_URL.replace(/\/$/, '')}${base}${base.includes('?') ? '&' : '?'}embed=1&theme=${theme}&lang=${lang}${hash ? `#${hash}` : ''}`
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-black shadow-card" style={{ width: d.frame, height: d.h * scale }}>
      <iframe title={`${p} ${theme} ${lang}`} src={src} loading="lazy" style={{ width: d.w, height: d.h, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }} />
    </div>
  )
}

export function BizScreenIndex() {
  const { reset, set } = useBiz()
  const navigate = useNavigate()
  const notes = useNotes()
  const [g, setG] = useState(0)
  const [device, setDevice] = useState<Device>('desktop')
  const [lang, setLang] = useState<'en' | 'tl'>('en')
  return (
    <main className="min-h-dvh bg-bg px-4 py-6 text-fg md:px-8">
      <header className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Jimbot crop="head" shape="squircle" size={52} />
            <div>
              <h1 className="text-title">Bitinary Business · Screen Index</h1>
              <p className="text-body text-fg-2">Business-only app. Light and Dark, English and Tagalog, 1280 / 768 / 390.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full bg-surface pl-4 pr-1 shadow-card">
              <span className="font-display text-[14px] font-medium">Design notes</span>
              <Toggle label="Design notes" checked={notes} onChange={setNotes} />
            </label>
            <Link to="/screens/mascot">
              <Button variant="secondary" icon={<Sparkles size={17} />}>
                Jimbot icon set
              </Button>
            </Link>
            <Button
              icon={<ExternalLink size={17} />}
              onClick={() => {
                reset()
                set((x) => ({ ...x, langPref: null }))
                navigate('/biz/language')
              }}
            >
              Open prototype
            </Button>
          </div>
        </div>
        <div className="mt-5 rounded-[20px] bg-surface p-4 shadow-card">
          <p className="mb-2 font-display text-[13px] font-semibold uppercase tracking-wide text-fg-2">Prototype path · code 123456</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" icon={<Play size={14} />} onClick={() => (reset(), set((x) => ({ ...x, langPref: null })), navigate('/biz/language'))}>
              Start
            </Button>
            {path.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="rounded-full bg-sunken px-3 py-1 font-display text-[13px] font-medium dark:bg-elevated">{s}</span>
                {i < path.length - 1 && <ArrowRight size={14} className="text-muted" />}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-caption text-fg-2">
            <span className="flex items-center gap-1.5"><PhaseTag phase="MVP" force /> Overview, Backgrounds, Quick Update, Health Score, Search, Account basics, sign-up and go live</span>
            <span className="flex items-center gap-1.5"><PhaseTag phase="P2" force /> Analytics, weekly report, Jimbot, deals, Customers sent, boosts, reservations</span>
            <span className="flex items-center gap-1.5"><PhaseTag phase="P3" force /> Posts and reels, Comments, Reviews and reporting, programs, branches</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {groups.map((x, i) => (
              <Chip key={x.title} active={i === g} onClick={() => setG(i)}>
                {x.title}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: 'en', label: 'English' }, { value: 'tl', label: 'Tagalog' }]} />
            <div className="flex gap-1 rounded-full bg-sunken p-1 dark:bg-elevated">
              {([['desktop', Monitor, '1280'], ['tablet', Tablet, '768'], ['mobile', Smartphone, '390']] as const).map(([dv, I, l]) => (
                <button key={dv} onClick={() => setDevice(dv)} aria-pressed={device === dv} className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 font-display text-[13px] font-medium', device === dv ? 'bg-primary text-ink' : 'text-fg-2')}>
                  <I size={16} /> {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <section className="mx-auto mt-6 max-w-[1400px] space-y-10">
        {groups[g].items.map((e) => {
          const dv = e.devices?.includes(device) ? device : (e.devices?.[e.devices.length - 1] ?? device)
          return (
            <article key={e.path}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-h3">{e.name}</h2>
                <PhaseTag phase={e.phase} force />
                <span className="text-caption text-fg-2">{(e.devices ?? ALL).join(' · ')}</span>
                {dv !== device && <span className="text-caption text-caution">showing {dv}</span>}
                <Link to={e.path} className="ml-auto font-display text-[13px] font-medium text-link">
                  Open →
                </Link>
              </div>
              <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
                {(['light', 'dark'] as const).map((th) => (
                  <div key={th} className="shrink-0">
                    <p className="mb-1.5 font-display text-[12px] font-semibold uppercase tracking-wide text-fg-2">{th}</p>
                    <Frame p={e.path} theme={th} device={dv} lang={lang} />
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
