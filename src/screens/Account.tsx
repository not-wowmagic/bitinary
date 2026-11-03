import { Store, Bell, Bookmark, ChevronRight, Database, Globe, HelpCircle, Lock, LogOut, Map, Palette, Captions, User, Wallet, RotateCcw, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAccount } from '@/app/account'
import { useStore } from '@/app/store'
import { useTheme, type ThemeMode } from '@/app/theme'
import { useLang } from '@/app/i18n'
import { cn } from '@/lib/cn'
import { ItineraryCard } from '@/components/cards/ItineraryCard'
import { ListingCard } from '@/components/cards/ListingCard'
import { LargeTitle } from '@/components/layout/TopBar'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { itineraries } from '@/data/itineraries'
import { places } from '@/data/places'
import { peso } from '@/lib/format'
import { usePersistentState } from '@/lib/usePersistentState'

type SheetKey = 'profile' | 'saved' | 'trips' | 'budget' | 'notif' | 'privacy' | 'help' | 'lang' | null

export function Account() {
  const { mode, setMode } = useTheme()
  const { saved, savedItineraries, dataSaver, setDataSaver, subtitles, setSubtitles, resetAll } = useStore()
  const { profile, prefs, session, signOut, resetEverything } = useAccount()
  const { lang, setLang } = useLang()
  const guest = session?.kind !== 'user'
  const [sheet, setSheet] = useState<SheetKey>(null)
  const [notif, setNotif] = usePersistentState('notifPrefs', { deals: true, trips: true, reels: false })
  const navigate = useNavigate()

  return (
    <main className="mx-auto max-w-[760px] pb-32 md:px-6 md:pb-12">
      <LargeTitle title={<span className="flex items-center gap-2">Account <PhaseTag phase="MVP" /></span>} />

      <section className="mx-4 mt-2 flex items-center gap-4 rounded-[24px] bg-primary p-4 md:mx-0">
        <div className="relative">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="h-[72px] w-[72px] rounded-full object-cover ring-[3px] ring-cream" />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-cream font-display text-[26px] font-bold text-brown">
              {guest ? 'G' : (profile.name || 'B').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )}
          <Jimbot crop="head" size={34} animate={false} className="absolute -bottom-1 -right-1 rounded-full ring-[3px] ring-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[22px] font-bold leading-tight text-white">{guest ? 'Guest' : profile.name || 'Biyahero'}</p>
          <p className="text-[14px] font-semibold text-ink">{guest ? 'Nag-e-explore muna' : `${session?.role === 'business' ? 'Negosyo' : 'Biyahero'}${profile.city ? ` · ${profile.city}` : ''}`}</p>
          <div className="mt-2 flex gap-3 font-display text-[13px] font-semibold text-ink">
            <span>{saved.length} naka-save</span>
            <span>{Math.max(savedItineraries.length, 1)} trip</span>
          </div>
        </div>
      </section>

      {guest && (
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card md:mx-0">
          <p className="flex-1 text-[15px]">Mag-sign up para ma-save ang trips, lugar at preferences mo.</p>
          <Button size="sm" onClick={() => navigate('/signup/role')}>
            Mag-sign up
          </Button>
        </div>
      )}

      <Group>
        <Item icon={<User size={19} />} color="#FF6A00" label="Profile" onClick={() => navigate('/personalize/about?from=prefs')} />
        <Item icon={<Sparkles size={19} />} color="#6B3A22" label={lang === 'en' ? 'My Preferences' : 'Mga Preference ko'} sub={lang === 'en' ? 'Travel history, budget, food, privacy' : 'Huling biyahe, budget, pagkain, privacy'} onClick={() => navigate('/account/preferences')} />
        {session?.role === 'business' && <Item icon={<Store size={19} />} color="#FF6A00" label={lang === 'en' ? 'Business dashboard' : 'Dashboard ng negosyo'} onClick={() => navigate('/biz')} />}
        <Item icon={<Bookmark size={19} />} color="#D32F2F" label="Naka-save" value={String(saved.length)} onClick={() => setSheet('saved')} />
        <Item icon={<Map size={19} />} color="#1B8A3A" label="Mga Trip" value={String(itineraries.length)} onClick={() => setSheet('trips')} />
        <Item icon={<Wallet size={19} />} color="#FFB400" iconFg="#2B130A" label="Budget preferences" value={`${peso(prefs.dailyBudget)}/araw`} onClick={() => navigate('/personalize/budget?from=prefs')} />
      </Group>

      <Group title="App">
        <Item icon={<Globe size={19} />} color="#0B7F96" label={lang === 'en' ? 'Language' : 'Wika'} value={lang === 'en' ? 'English' : 'Tagalog'} onClick={() => setSheet('lang')} />
        <li className="flex flex-col gap-2.5 px-4 py-3">
          <div className="flex items-center gap-3">
            <IconTile color="#6B3A22">
              <Palette size={19} />
            </IconTile>
            <span className="text-body">Itsura</span>
          </div>
          <Segmented<ThemeMode>
            label="Itsura"
            className="w-full"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </li>
        <Item icon={<Database size={19} />} color="#B26A00" label="Data saver" sub="Walang autoplay ng Reels sa mobile data" trailing={<Toggle label="Data saver" checked={dataSaver} onChange={setDataSaver} />} />
        <Item icon={<Captions size={19} />} color="#3A1A0E" label="Tagalog captions sa Reels" trailing={<Toggle label="Captions" checked={subtitles} onChange={setSubtitles} />} />
        <Item icon={<Bell size={19} />} color="#C2185B" label="Notifications" onClick={() => setSheet('notif')} />
        <Item icon={<Lock size={19} />} color="#1B8A3A" label="Privacy" onClick={() => navigate('/personalize/privacy?from=prefs')} />
      </Group>

      <Group>
        <Item icon={<HelpCircle size={19} />} color="#C84A00" label="Tulong" onClick={() => setSheet('help')} />
        <Item
          icon={<LogOut size={19} />}
          color="#D32F2F"
          label={guest ? 'Lumabas sa guest mode' : 'Mag-log out'}
          danger
          onClick={() => {
            signOut()
            navigate('/splash', { replace: true })
          }}
        />
        <Item
          icon={<RotateCcw size={19} />}
          color="#6B3A22"
          label="I-reset ang demo"
          sub="Burahin ang lahat at simulan ulit ang first-time flow"
          onClick={() => {
            resetAll()
            resetEverything()
            navigate('/splash', { replace: true })
          }}
        />
      </Group>
      <p className="mt-6 text-center text-caption text-fg-2">Bitinary v1.0 · Ginawa sa Pilipinas</p>

      <Sheet open={sheet === 'saved'} onClose={() => setSheet(null)} title="Naka-save">
        <div className="space-y-2.5">
          {places.filter((p) => saved.includes(p.id)).map((p) => (
            <ListingCard key={p.id} place={p} layout="row" />
          ))}
          {!saved.length && <p className="py-6 text-center text-body text-fg-2">Wala pang naka-save.</p>}
        </div>
      </Sheet>
      <Sheet open={sheet === 'trips'} onClose={() => setSheet(null)} title="Mga Trip">
        <div className="space-y-3">
          {itineraries.map((it) => (
            <ItineraryCard key={it.id} it={it} className="w-full" />
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === 'lang'} onClose={() => setSheet(null)} title={lang === 'en' ? 'Language' : 'Wika'}>
        <div className="space-y-2" role="radiogroup">
          {([['tl', 'Tagalog'], ['en', 'English']] as const).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={lang === v} onClick={() => (setLang(v), setSheet(null))} className={cn('flex h-12 w-full items-center justify-between rounded-2xl px-4', lang === v ? 'bg-sunken dark:bg-elevated' : '')}>
              <span className="text-body font-semibold">{l}</span>
              {lang === v && <span className="text-link">{lang === 'en' ? 'Selected' : 'Napili'}</span>}
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === 'notif'} onClose={() => setSheet(null)} title="Notifications">
        <ul className="divide-y divide-line">
          {([
            ['deals', 'Mga deal at promo malapit sa iyo'],
            ['trips', 'Paalala sa trip at itinerary'],
            ['reels', 'Bagong Reels mula sa sinusundan mo'],
          ] as const).map(([k, l]) => (
            <li key={k} className="flex items-center justify-between gap-3 py-1">
              <span className="text-body">{l}</span>
              <Toggle label={l} checked={notif[k]} onChange={(v) => setNotif({ ...notif, [k]: v })} />
            </li>
          ))}
        </ul>
      </Sheet>
      <Sheet open={sheet === 'help'} onClose={() => setSheet(null)} title="Tulong">
        <div className="flex items-center gap-3 rounded-2xl bg-sunken p-3 dark:bg-elevated">
          <Jimbot crop="head" size={44} expression="pointing" animate={false} />
          <p className="text-body">Puwede mo ring tanungin si Jimbot ng "Tulong" anumang oras.</p>
        </div>
        <Button block className="mt-4" onClick={() => navigate('/jimbot')}>
          Kausapin si Jimbot
        </Button>
      </Sheet>
    </main>
  )
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mx-4 mt-6 md:mx-0">
      {title && <h2 className="mb-1.5 px-4 font-display text-[13px] font-medium uppercase tracking-wide text-fg-2">{title}</h2>}
      <ul className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface shadow-card">{children}</ul>
    </section>
  )
}

function IconTile({ color, fg = '#fff', children }: { color: string; fg?: string; children: ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]" style={{ background: color, color: fg }}>
      {children}
    </span>
  )
}

function Item({ icon, color, iconFg, label, value, sub, onClick, trailing, danger }: { icon: ReactNode; color: string; iconFg?: string; label: string; value?: string; sub?: string; onClick?: () => void; trailing?: ReactNode; danger?: boolean }) {
  const content = (
    <>
      <IconTile color={color} fg={iconFg}>
        {icon}
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className={`block text-body ${danger ? 'text-danger' : ''}`}>{label}</span>
        {sub && <span className="block text-caption text-fg-2">{sub}</span>}
      </span>
      {value && <span className="text-body text-fg-2">{value}</span>}
      {trailing ?? (onClick && <ChevronRight size={18} className="text-muted" />)}
    </>
  )
  return (
    <li>
      {onClick && !trailing ? (
        <button onClick={onClick} className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-sunken/60">
          {content}
        </button>
      ) : (
        <div className="flex min-h-[52px] items-center gap-3 px-4 py-1">{content}</div>
      )}
    </li>
  )
}
