import { ArrowRight, ExternalLink, LayoutGrid, MessageCircle, Monitor, Smartphone, Sparkles, Tablet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAccount } from '@/app/account'
import { useStore } from '@/app/store'
import { CategoryTile, categories } from '@/components/cards/CategoryTile'
import { ItineraryCard } from '@/components/cards/ItineraryCard'
import { ListingCard } from '@/components/cards/ListingCard'
import { Polaroid, frameStyles } from '@/components/cards/Polaroid'
import { PromoBanner } from '@/components/cards/PromoCarousel'
import { ReelCard } from '@/components/cards/ReelCard'
import { SponsoredCard } from '@/components/cards/SponsoredCard'
import { FoxIcon, HomeIcon, PolaroidIcon, SearchIcon, UserIcon } from '@/components/icons/TabIcons'
import { MapArt } from '@/components/map/MapArt'
import { PhotoPin, UserDot } from '@/components/map/MapPins'
import { Jimbot, expressionLabel, expressions, isPlaceholder } from '@/components/mascot/Jimbot'
import { MascotSheet as IconSetSheet, OnboardingKitDemo } from './IconSet'
import { StateView } from '@/components/states/States'
import { Button, IconButton } from '@/components/ui/Button'
import { Bar, Donut, ProgressRing } from '@/components/ui/Charts'
import { Chip } from '@/components/ui/Chip'
import { PhaseTag, setNotes, useNotes } from '@/components/ui/PhaseTag'
import { ClosingPill, CautionPill, NewTag, Pill, QueuePill, SponsoredTag, VerifiedPill } from '@/components/ui/Pill'
import { Segmented } from '@/components/ui/Segmented'
import { Toggle } from '@/components/ui/Toggle'
import { itineraries } from '@/data/itineraries'
import { sampleMoments, type MomentFrame } from '@/data/moments'
import { places } from '@/data/places'
import { promos } from '@/data/promos'
import { reels } from '@/data/reels'
import { cn } from '@/lib/cn'
import {
  Bed, Bell, Boat, Calendar, ChartBar, Clock, Coffee, Edit, Filter, Heart, Map, MapPin, Megaphone, Play, QrCode, Search, Share, ShieldCheck, Star, Store, Tag, Ticket, Utensils, Wallet, WifiOff,
} from './appIcons'
type Phase = 'MVP' | 'P2' | 'P3'
type Entry = { name: string; path: string; phase: Phase; note?: string }

const groups: { title: string; items: Entry[] }[] = [
  {
    title: 'Sign-up at Login',
    items: [
      { name: 'Splash (Hello fox)', path: '/splash?state=hold', phase: 'MVP' },
      { name: 'Language picker (first launch)', path: '/language', phase: 'MVP' },
      { name: 'Welcome', path: '/welcome', phase: 'MVP' },
      { name: 'Welcome · ituloy kung saan huminto', path: '/welcome?state=resume', phase: 'MVP' },
      { name: '1 · Role', path: '/signup/role', phase: 'MVP' },
      { name: '2 · Method (sign up)', path: '/auth?mode=signup', phase: 'MVP' },
      { name: '2 · Method (log in, segmented)', path: '/auth?mode=login', phase: 'MVP' },
      { name: '2 · Google account picker', path: '/auth?mode=signup&state=google', phase: 'MVP' },
      { name: '2 · Email', path: '/auth/email?mode=signup', phase: 'MVP' },
      { name: 'Error · no internet', path: '/auth?mode=signup&state=offline', phase: 'MVP' },
      { name: '3 · Verify SMS', path: '/auth/verify?via=sms&to=9181234567', phase: 'MVP' },
      { name: '3 · Verify email', path: '/auth/verify?via=email&to=nena@kapihan.ph', phase: 'MVP' },
      { name: 'Error · wrong code', path: '/auth/verify?via=sms&to=9181234567&state=wrong', phase: 'MVP' },
      { name: 'Error · expired code', path: '/auth/verify?via=sms&to=9181234567&state=expired', phase: 'MVP' },
      { name: 'Error · too many attempts', path: '/auth/verify?via=sms&to=9181234567&state=locked', phase: 'MVP' },
      { name: 'Error · verify offline', path: '/auth/verify?via=sms&to=9181234567&state=offline', phase: 'MVP' },
      { name: '4 · Name and nickname', path: '/signup/name', phase: 'MVP' },
      { name: '4 · Name · required error', path: '/signup/name?state=error', phase: 'MVP' },
      { name: '5 · Account ready (Celebrate)', path: '/signup/ready', phase: 'MVP' },
    ],
  },
  {
    title: 'Customization (Biyahero)',
    items: [
      { name: 'Hub · Personalize Bitinary', path: '/personalize', phase: 'MVP', note: 'Tablet at desktop: two columns' },
      { name: 'Hub · in progress', path: '/personalize?state=sample', phase: 'MVP' },
      { name: 'Hub · Salamat! (after a theme)', path: '/personalize?state=thanks', phase: 'MVP' },
      { name: 'Hub · desktop with theme open', path: '/personalize/trip?state=sample', phase: 'MVP', note: 'Switch to 1280' },
      { name: 'Theme · Huling Biyahe', path: '/personalize/trip', phase: 'MVP' },
      { name: 'Theme · Budget', path: '/personalize/budget', phase: 'MVP' },
      { name: 'Theme · Privacy at Pahintulot', path: '/personalize/privacy', phase: 'MVP' },
      { name: 'Privacy · location pre-explanation', path: '/personalize/privacy?state=location', phase: 'MVP' },
      { name: 'Privacy · system alert', path: '/personalize/privacy?state=system', phase: 'MVP' },
      { name: 'Theme · Pagkain', path: '/personalize/food', phase: 'MVP' },
      { name: 'Theme · Mga Gusto', path: '/personalize/interests', phase: 'MVP' },
      { name: 'Theme · Kasama at Biyahe', path: '/personalize/companions', phase: 'MVP' },
      { name: 'Theme · Kailangan', path: '/personalize/needs', phase: 'MVP' },
      { name: 'Theme · Tungkol Sa Iyo', path: '/personalize/about', phase: 'MVP' },
      { name: 'Account › Preferences', path: '/account/preferences', phase: 'MVP' },
      { name: 'Preferences · Tama pa ba ito?', path: '/account/preferences?state=stale', phase: 'MVP' },
    ],
  },
  {
    title: 'Business registration',
    items: [
      { name: 'Business hub', path: '/business/setup?state=draft', phase: 'MVP', note: 'Tablet at desktop: two columns' },
      { name: 'Business hub · ready to go live', path: '/business/setup?state=sample', phase: 'MVP' },
      { name: 'Required 1 · Negosyo', path: '/business/setup/basics', phase: 'MVP' },
      { name: 'Required 2 · Lokasyon (map pin)', path: '/business/setup/location', phase: 'MVP' },
      { name: 'Required 3 · Oras', path: '/business/setup/hours', phase: 'MVP' },
      { name: 'Required 4 · Contact', path: '/business/setup/contact', phase: 'MVP' },
      { name: 'Optional · Menu at Presyo', path: '/business/setup/menu', phase: 'MVP' },
      { name: 'Optional · Larawan', path: '/business/setup/photos', phase: 'MVP' },
      { name: 'Optional · Kuwento', path: '/business/setup/about', phase: 'MVP' },
      { name: 'Optional · Online', path: '/business/setup/online', phase: 'MVP' },
      { name: 'Optional · Mga Layunin', path: '/business/setup/goals', phase: 'MVP' },
      { name: 'Optional · Beripikasyon', path: '/business/setup/verify', phase: 'MVP' },
      { name: 'State · required field error', path: '/business/setup/basics?state=error', phase: 'MVP' },
      { name: 'State · unsaved changes', path: '/business/setup/basics?state=unsaved', phase: 'MVP' },
      { name: 'State · offline (save locally)', path: '/business/setup/contact?state=offline', phase: 'MVP' },
      { name: 'State · duplicate business', path: '/business/setup/location?state=duplicate', phase: 'MVP' },
      { name: 'Preview bago mag-live', path: '/business/preview?state=sample', phase: 'MVP', note: 'Desktop: two columns' },
      { name: 'Go live success', path: '/business/live?state=sample', phase: 'MVP', note: 'Desktop: preview on the right' },
      { name: 'Dashboard first-run (live, not verified)', path: '/business?state=live', phase: 'MVP' },
      { name: 'Dashboard · draft reminder', path: '/business?state=draft', phase: 'MVP' },
      { name: 'Dashboard · verified', path: '/business?state=verified', phase: 'MVP' },
    ],
  },
  {
    title: 'Business profile (Facebook-style, Bootstrap)',
    items: [
      { name: 'Mga Negosyo (directory)', path: '/negosyo', phase: 'MVP' },
      { name: 'Profile · Mga Post (linked to /biz)', path: '/shop/mangben', phase: 'MVP', note: 'Desktop: Facebook two-column layout' },
      { name: 'Profile · Reviews', path: '/shop/mangben?tab=reviews', phase: 'MVP' },
      { name: 'Write a review', path: '/shop/mangben?tab=reviews&review=new', phase: 'MVP' },
      { name: 'Comments on a post', path: '/shop/mangben?comments=p1', phase: 'MVP' },
      { name: 'Profile · ad post', path: '/shop/p2', phase: 'P2' },
      { name: 'Profile · photos', path: '/shop/p5?tab=photos', phase: 'MVP' },
      { name: 'Profile · loading', path: '/shop/p1?state=loading', phase: 'MVP' },
      { name: 'Profile · no posts yet', path: '/shop/p1?state=empty', phase: 'MVP' },
    ],
  },
  {
    title: 'Home',
    items: [
      { name: 'Home v1 (MVP)', path: '/home-v1', phase: 'MVP' },
      { name: 'Home full', path: '/', phase: 'P2', note: 'Promo, Sponsored (P2), Reels (P3)' },
      { name: 'Home · loading', path: '/?state=loading', phase: 'MVP' },
      { name: 'Home · offline', path: '/?state=offline', phase: 'MVP' },
      { name: 'Home · install banner', path: '/?state=install', phase: 'MVP' },
    ],
  },
  {
    title: 'Reels',
    items: [
      { name: 'Reels Viewer', path: '/reels/r1', phase: 'P3' },
      { name: 'Reels · sponsored', path: '/reels/r3', phase: 'P3' },
      { name: 'Reels · loading', path: '/reels/r1?state=loading', phase: 'P3' },
      { name: 'Reels · buffering', path: '/reels/r1?state=buffering', phase: 'P3' },
      { name: 'Reels · offline', path: '/reels/r1?state=offline', phase: 'P3' },
      { name: 'Reels · empty', path: '/reels/r1?state=empty', phase: 'P3' },
    ],
  },
  {
    title: 'Jimbot at Itinerary',
    items: [
      { name: 'Jimbot chat', path: '/jimbot', phase: 'MVP' },
      { name: 'Jimbot · thinking', path: '/jimbot?state=loading', phase: 'MVP' },
      { name: 'Jimbot · bago', path: '/jimbot?state=empty', phase: 'MVP' },
      { name: 'Jimbot · offline', path: '/jimbot?state=offline', phase: 'MVP' },
      { name: 'Itinerary', path: '/itinerary/it1', phase: 'MVP' },
    ],
  },
  {
    title: 'Search at Shop Detail',
    items: [
      { name: 'Search', path: '/search', phase: 'MVP' },
      { name: 'Search · resulta', path: '/search?q=kape', phase: 'MVP' },
      { name: 'Search · walang resulta', path: '/search?q=Boracay', phase: 'MVP' },
      { name: 'Shop Detail', path: '/shop/p5', phase: 'MVP' },
      { name: 'Shop Detail · closing soon', path: '/shop/p4', phase: 'MVP' },
    ],
  },
  {
    title: 'Moments',
    items: [
      { name: 'Camera (default)', path: '/moments?state=sample', phase: 'P3' },
      { name: 'Camera · first-time tip', path: '/moments?state=tip', phase: 'P3' },
      { name: 'Camera · after capture', path: '/moments?state=captured', phase: 'P3' },
      { name: 'Camera · permission', path: '/moments?state=permission', phase: 'P3' },
      { name: 'Mapa', path: '/moments/map', phase: 'P3' },
      { name: 'Gallery · peek', path: '/moments/map?state=peek', phase: 'P3' },
      { name: 'Gallery · half', path: '/moments/map?state=half', phase: 'P3' },
      { name: 'Gallery · full', path: '/moments/map?state=full', phase: 'P3' },
      { name: 'Gallery · loading', path: '/moments/map?state=loading&gallery=half', phase: 'P3' },
      { name: 'Mapa · location permission', path: '/moments/map?state=location', phase: 'P3' },
      { name: 'Mapa · empty', path: '/moments/map?state=empty', phase: 'P3' },
      { name: 'Mapa · offline', path: '/moments/map?state=offline', phase: 'P3' },
      { name: 'Create Moment', path: '/moments/create', phase: 'P3' },
    ],
  },
  { title: 'Account', items: [{ name: 'Account', path: '/account', phase: 'MVP' }] },
]

const devices = {
  mobile: { w: 390, h: 844, frame: 270 },
  tablet: { w: 768, h: 1024, frame: 400 },
  desktop: { w: 1280, h: 800, frame: 620 },
}
type Device = keyof typeof devices

const paths: { key: string; title: string; role: 'traveler' | 'business'; start: string; steps: string[] }[] = [
  { key: 'a', title: '(a) Biyahero', role: 'traveler', start: '/welcome', steps: ['Welcome', 'Role', 'Email', 'Verify', 'Name', 'Account ready', 'Hub', 'Huling Biyahe', 'Hub', 'Skip', 'Home'] },
  { key: 'b', title: '(b) Negosyo', role: 'business', start: '/signup/role', steps: ['Role', 'Email', 'Verify', 'Name', 'Business hub', '4 required themes', 'Preview', 'Go live', 'Dashboard'] },
  { key: 'c', title: '(c) Negosyo, required only', role: 'business', start: '/signup/role', steps: ['Role', 'Email', 'Verify', 'Name', 'Business hub', 'Negosyo', 'Lokasyon', 'Oras', 'Contact', 'Go live (skip all optional)', 'Dashboard'] },
]

function Frame({ path, theme, device, lang }: { path: string; theme: 'light' | 'dark'; device: Device; lang: 'tl' | 'en' }) {
  const d = devices[device]
  const scale = d.frame / d.w
  const src = `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}${path.includes('?') ? '&' : '?'}embed=1&theme=${theme}&lang=${lang}`
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-black shadow-card" style={{ width: d.frame, height: d.h * scale }}>
      <iframe title={`${path} ${theme}`} src={src} loading="lazy" style={{ width: d.w, height: d.h, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }} />
    </div>
  )
}

export function ScreenIndex() {
  const [device, setDevice] = useState<Device>('mobile')
  const [group, setGroup] = useState(0)
  const notes = useNotes()
  const [lang, setLang] = useState<'tl' | 'en'>('tl')
  const { resetEverything, setRole } = useAccount()
  const { resetAll } = useStore()
  const navigate = useNavigate()
  const g = groups[group]
  const startPath = (pth: (typeof paths)[number]) => {
    resetAll()
    resetEverything()
    setRole(pth.role)
    navigate(pth.start)
  }
  return (
    <main className="min-h-dvh bg-bg px-4 py-6 md:px-8">
      <header className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Jimbot crop="head" size={52} animate={false} shape="squircle" />
            <div>
              <h1 className="text-title">Bitinary · Screen Index</h1>
              <p className="text-body text-fg-2">Bawat screen sa Light at Dark, Tagalog at English, 390 / 768 / 1280.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full bg-surface pl-4 pr-1 shadow-card">
              <span className="font-display text-[14px] font-medium">Design notes</span>
              <Toggle label="Design notes" checked={notes} onChange={setNotes} />
            </label>
            <Link to="/biz/screens">
              <Button variant="secondary">Bitinary Business</Button>
            </Link>
            <Link to="/screens/mascot">
              <Button variant="secondary" icon={<Sparkles size={17} />}>
                Jimbot icon set
              </Button>
            </Link>
            <Link to="/screens/components">
              <Button variant="secondary" icon={<LayoutGrid size={17} />}>
                Components
              </Button>
            </Link>
            <Link to="/splash">
              <Button icon={<ExternalLink size={17} />}>Buksan ang prototype</Button>
            </Link>
          </div>
        </div>

        <div className="mt-5 rounded-[20px] bg-surface p-4 shadow-card">
          <p className="mb-2 font-display text-[13px] font-semibold uppercase tracking-wide text-fg-2">Prototype paths · demo code 123456</p>
          <div className="space-y-2.5">
            {paths.map((pth) => (
              <div key={pth.key} className="flex flex-wrap items-center gap-1.5">
                <Button size="sm" onClick={() => startPath(pth)} icon={<Play size={14} />}>
                  {pth.title}
                </Button>
                {pth.steps.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="rounded-full bg-sunken px-3 py-1 font-display text-[13px] font-medium dark:bg-elevated">{f}</span>
                    {i < pth.steps.length - 1 && <ArrowRight size={14} className="text-muted" />}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-caption text-fg-2">
            <span className="flex items-center gap-1.5"><PhaseTag phase="MVP" force /> First-time flow, Home v1, Jimbot, Itinerary, Search, Shop Detail, Account</span>
            <span className="flex items-center gap-1.5"><PhaseTag phase="P2" force /> Promo banners, Sponsored ads</span>
            <span className="flex items-center gap-1.5"><PhaseTag phase="P3" force /> Reels, Moments</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {groups.map((x, i) => (
              <Chip key={x.title} active={i === group} onClick={() => setGroup(i)}>
                {x.title}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
          <Segmented label="Wika" value={lang} onChange={setLang} options={[{ value: 'tl', label: 'Tagalog' }, { value: 'en', label: 'English' }]} />
          <div className="flex gap-1 rounded-full bg-sunken p-1 dark:bg-elevated">
            {([
              ['mobile', Smartphone, '390'],
              ['tablet', Tablet, '768'],
              ['desktop', Monitor, '1280'],
            ] as const).map(([d, I, l]) => (
              <button key={d} onClick={() => setDevice(d)} aria-pressed={device === d} className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 font-display text-[13px] font-medium', device === d ? 'bg-primary text-ink' : 'text-fg-2')}>
                <I size={16} /> {l}
              </button>
            ))}
          </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-[1400px] space-y-10">
        {g.items.map((e) => (
          <article key={e.path}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{e.name}</h2>
              <PhaseTag phase={e.phase} force />
              {e.note && <span className="text-caption text-fg-2">{e.note}</span>}
              <Link to={e.path} className="ml-auto font-display text-[13px] font-medium text-link">
                Buksan →
              </Link>
            </div>
            <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
              {(['light', 'dark'] as const).map((t) => (
                <div key={t} className="shrink-0">
                  <p className="mb-1.5 font-display text-[12px] font-semibold uppercase tracking-wide text-fg-2">{t === 'light' ? 'Light' : 'Dark'}</p>
                  <Frame path={e.path} theme={t} device={device} lang={lang} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

/* ------------------------------ Component sheet ------------------------------ */

function Block({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-[13px] font-semibold uppercase tracking-wide text-fg-2">{title}</h3>
      <div className={className}>{children}</div>
    </section>
  )
}

const tokenList = ['primary', 'link', 'fg', 'fg-2', 'muted', 'bg', 'surface', 'elevated', 'line', 'amber', 'ok', 'ok-bg', 'danger', 'danger-bg', 'caution', 'caution-bg']

function SheetColumn({ theme }: { theme: 'light' | 'dark' }) {
  const [seg, setSeg] = useState('a')
  const [tog, setTog] = useState(true)
  return (
    <div data-theme={theme} data-scope={theme === 'light' ? 'light' : undefined} className="min-w-0 space-y-8 rounded-[28px] bg-bg p-5 text-fg md:p-6">
      <h2 className="text-h2">{theme === 'light' ? 'Light mode' : 'Dark mode'}</h2>

      <Block title="Kulay (variables)" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {tokenList.map((t) => (
          <div key={t} className="text-center">
            <div className="h-12 rounded-xl border border-line" style={{ background: `var(--c-${t})` }} />
            <p className="mt-1 truncate text-[11px] text-fg-2">{t}</p>
          </div>
        ))}
      </Block>

      <Block title="Typography" className="space-y-1">
        <p className="text-title">Large title 32 · Poppins</p>
        <p className="text-h2">H2 22 · Poppins 600</p>
        <p className="text-body">Body 16 · Open Sans. Saan tayo kakain ngayon?</p>
        <p className="text-caption text-fg-2">Caption 13 · Na-verify, 12 araw</p>
        <p className="font-hand text-[26px]">Handwritten caption · Caveat</p>
      </Block>

      <Block title="Icons · 24px · 1.75 stroke" className="space-y-3">
        <div className="flex flex-wrap gap-4 text-fg">
          {[HomeIcon, FoxIcon, SearchIcon, PolaroidIcon, UserIcon].map((I, i) => (
            <div key={i} className="flex gap-1.5">
              <I />
              <span className="rounded-lg bg-primary p-0.5 text-ink">
                <I active />
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-fg">
          {[Search, MessageCircle, Sparkles, Bell, Heart, MapPin, Map, Utensils, Coffee, Bed, Boat, Ticket, Tag, Play, Wallet, ChartBar, Store, Edit, Share, Filter, Clock, Star, ShieldCheck, WifiOff, QrCode, Calendar, Megaphone].map((I, i) => (
            <I key={i} size={24} strokeWidth={1.75} />
          ))}
        </div>
      </Block>

      <Block title="Buttons" className="flex flex-wrap items-center gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Link</Button>
        <Button variant="brown">Brown</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Small</Button>
        <IconButton label="Heart" variant="surface">
          <Heart size={20} />
        </IconButton>
      </Block>

      <Block title="Status pills" className="flex flex-wrap gap-2">
        <VerifiedPill days={12} />
        <ClosingPill at="8:30 PM" />
        <CautionPill>Tantya lang</CautionPill>
        <QueuePill queue="mahaba" />
        <SponsoredTag />
        <NewTag />
        <Pill kind="open">Bukas ngayon</Pill>
      </Block>

      <Block title="Chips · segmented · toggle" className="flex flex-wrap items-center gap-3">
        <Chip active>Lahat</Chip>
        <Chip>Pagkain</Chip>
        <Segmented value={seg} onChange={setSeg} options={[{ value: 'a', label: 'Camera' }, { value: 'b', label: 'Mapa' }]} />
        <Toggle label="Demo" checked={tog} onChange={setTog} />
      </Block>

      <Block title="Category tiles" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {categories.map((c) => (
          <CategoryTile key={c} category={c} />
        ))}
      </Block>

      <Block title="Jimbot · poses" className="grid grid-cols-4 gap-3">
        {expressions.map((e) => (
          <div key={e} className="flex flex-col items-center rounded-2xl bg-surface p-2 shadow-card">
            <Jimbot expression={e} variant="standalone" size={92} />
            <span className="mt-1 text-[12px] text-fg-2">{expressionLabel[e]}</span>
            {isPlaceholder(e) && <span className="mt-0.5 rounded bg-caution-bg px-1.5 text-[10px] font-semibold text-caution">TBR</span>}
          </div>
        ))}
      </Block>

      <Block title="Onboarding components" className="space-y-4">
        <OnboardingKitDemo />
      </Block>

      <Block title="Cards" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <ListingCard place={places[0]} />
          <ListingCard place={places[3]} />
        </div>
        <ListingCard place={places[1]} layout="row" />
        <div className="-mx-4">
          <SponsoredCard slot={1} />
        </div>
        <PromoBanner
          banner={{
            id: `preview-${promos[1].id}`,
            name: promos[1].title,
            placement: 'home-carousel',
            status: 'live',
            title: promos[1].title,
            subtitle: promos[1].subtitle,
            cta: promos[1].cta,
            image: promos[1].image,
            tone: promos[1].tone,
            link: { kind: 'place', placeId: promos[1].placeId },
            audience: 'all',
            priority: 0,
            label: promos[1].until,
            stats: { views: 0, clicks: 0 },
            createdAt: new Date().toISOString(),
          }}
        />
        <div className="flex items-end gap-3">
          <ReelCard reel={reels[0]} featured />
          <ReelCard reel={reels[2]} />
        </div>
        <ItineraryCard it={itineraries[0]} className="w-full" />
      </Block>

      <Block title="Chat bubbles" className="space-y-2">
        <div className="flex justify-end">
          <p className="max-w-[80%] rounded-[22px] rounded-br-md bg-deep px-4 py-2.5 text-white">May ₱1,500 ako para bukas.</p>
        </div>
        <div className="flex items-start gap-2">
          <Jimbot crop="head" size={36} animate={false} />
          <p className="card rounded-[22px] rounded-tl-md px-4 py-3">Ayos! Gagawa ako ng plano gamit ang verified na lugar.</p>
        </div>
      </Block>

      <Block title="Polaroid frames" className="flex flex-wrap gap-4 pt-2">
        {(Object.keys(frameStyles) as MomentFrame[]).map((f, i) => (
          <Polaroid key={f} src={sampleMoments[i].src} caption={frameStyles[f].label} date={sampleMoments[i].date} frame={f} tilt={i % 2 ? 3 : -3} width={120} />
        ))}
      </Block>

      <Block title="Map pins · cluster · user" className="relative h-[180px] overflow-hidden rounded-[20px]">
        <svg viewBox="420 420 360 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <MapArt />
        </svg>
        <UserDot x={90} y={100} radius={40} />
        <PhotoPin x={190} y={80} count={1} src={sampleMoments[1].src} label="pin" />
        <PhotoPin x={270} y={100} count={5} src={sampleMoments[0].src} label="cluster" />
        <PhotoPin x={360} y={90} count={3} src={sampleMoments[3].src} selected label="selected" />
      </Block>

      <Block title="Charts" className="flex flex-wrap items-center gap-6">
        <ProgressRing value={0.82} size={80}>
          <span className="font-display text-[16px] font-bold">82%</span>
        </ProgressRing>
        <Donut segments={[{ label: 'Pagkain', value: 560, color: '#FF6A00' }, { label: 'Transport', value: 250, color: '#6B3A22' }, { label: 'Aktibidad', value: 425, color: '#FFB400' }]} size={110} stroke={16}>
          <span className="font-display text-[15px] font-bold">₱1,235</span>
        </Donut>
        <div className="w-40 space-y-2">
          <Bar value={560} max={800} planned={700} />
          <Bar value={250} max={800} planned={300} color="#6B3A22" />
        </div>
      </Block>

      <Block title="States" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] bg-surface shadow-card">
          <StateView expression="sleeping" size={80} title="Offline" body="Natutulog si Jimbot." className="px-3 py-5" />
        </div>
        <div className="rounded-[20px] bg-surface shadow-card">
          <StateView expression="unsure" size={80} title="Hindi sigurado" body="Walang verified na data." className="px-3 py-5" />
        </div>
        <div className="rounded-[20px] bg-surface shadow-card">
          <StateView expression="celebrating" size={80} title="Na-save!" body="Verified na." className="px-3 py-5" />
        </div>
      </Block>
    </div>
  )
}

export const MascotSheet = IconSetSheet

export function ComponentSheet() {
  return (
    <main className="min-h-dvh bg-sunken px-3 py-6 md:px-8">
      <header className="mx-auto mb-6 flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title">Components at Styles</h1>
          <p className="text-body text-fg-2">Color, text at effect styles bilang variables, Light at Dark.</p>
        </div>
        <Link to="/screens">
          <Button variant="secondary">← Screen Index</Button>
        </Link>
      </header>
      <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-2">
        <SheetColumn theme="light" />
        <SheetColumn theme="dark" />
      </div>
    </main>
  )
}
