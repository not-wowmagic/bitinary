import { Store, Bell, Bookmark, ChevronRight, Database, Globe, HelpCircle, Lock, LogOut, Map, Palette, Captions, User, Wallet, Sparkles, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
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
import { PasswordField } from '@/components/flow/Fields'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { itineraries } from '@/data/itineraries'
import { places } from '@/data/places'
import { peso } from '@/lib/format'
import { usePersistentState } from '@/lib/usePersistentState'
import { isGoogleOnlyAccount } from '@/lib/authFlow'
import { supabase } from '@/lib/supabase'

type SheetKey = 'profile' | 'security' | 'saved' | 'trips' | 'budget' | 'notif' | 'privacy' | 'help' | 'lang' | null

export function Account() {
  const { mode, setMode } = useTheme()
  const { saved, savedItineraries, dataSaver, setDataSaver, subtitles, setSubtitles, showToast } = useStore()
  const { profile, prefs, session, signOut, updatePassword } = useAccount()
  const { lang, setLang, t } = useLang()
  const guest = session?.kind !== 'user'
  const [sheet, setSheet] = useState<SheetKey>(null)
  const [notif, setNotif] = usePersistentState('notifPrefs', { deals: true, trips: true, reels: false })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [requiresCurrentPassword, setRequiresCurrentPassword] = useState(true)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [securityMessage, setSecurityMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (sheet !== 'security' || guest) return
    let active = true
    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setPasswordError(error.message)
          return
        }
        setRequiresCurrentPassword(!isGoogleOnlyAccount(data.user?.app_metadata?.providers))
      })
      .catch((error: unknown) => {
        if (active) setPasswordError(error instanceof Error ? error.message : 'Could not load account security settings.')
      })
    return () => {
      active = false
    }
  }, [guest, sheet])

  const clearPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setSecurityMessage(null)
  }

  return (
    <main className="mx-auto max-w-[760px] pb-32 md:px-6 md:pb-12">
      <LargeTitle title={<span className="flex items-center gap-2">{t('Aking pahina', 'Account')} <PhaseTag phase="MVP" /></span>} />

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
          <p className="font-display text-[22px] font-bold leading-tight text-white">{guest ? t('Panauhin', 'Guest') : profile.name || t('Biyahero', 'Traveler')}</p>
          <p className="text-[14px] font-semibold text-ink">{guest ? t('Nagtutuklas muna', 'Exploring for now') : `${session?.role === 'business' ? t('Negosyo', 'Business') : t('Biyahero', 'Traveler')}${profile.city ? ` · ${profile.city}` : ''}`}</p>
          <div className="mt-2 flex gap-3 font-display text-[13px] font-semibold text-ink">
            <span>{saved.length} {t('naka-save', 'saved')}</span>
            <span>{Math.max(savedItineraries.length, 1)} {t('biyahe', 'trips')}</span>
          </div>
        </div>
      </section>

      {guest && (
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card md:mx-0">
          <p className="flex-1 text-[15px]">{t('Magparehistro upang ma-save ang iyong mga biyahe, lugar, at kagustuhan.', 'Sign up to save your trips, places, and preferences.')}</p>
          <Button size="sm" onClick={() => navigate('/signup/role')}>
            {t('Magparehistro', 'Sign up')}
          </Button>
        </div>
      )}

      <Group>
        <Item icon={<User size={19} />} color="#FF6A00" label={t('Tungkol sa akin', 'Profile')} onClick={() => navigate('/personalize/about?from=prefs')} />
        <Item icon={<Sparkles size={19} />} color="#6B3A22" label={lang === 'en' ? 'My Preferences' : 'Mga Preference ko'} sub={lang === 'en' ? 'Travel history, budget, food, privacy' : 'Huling biyahe, budget, pagkain, privacy'} onClick={() => navigate('/account/preferences')} />
        {session?.role === 'business' && <Item icon={<Store size={19} />} color="#FF6A00" label={lang === 'en' ? 'Business dashboard' : 'Dashboard ng negosyo'} onClick={() => navigate('/biz')} />}
        <Item icon={<Bookmark size={19} />} color="#D32F2F" label={t('Naka-save', 'Saved')} value={String(saved.length)} onClick={() => setSheet('saved')} />
        <Item icon={<Map size={19} />} color="#1B8A3A" label={t('Mga biyahe', 'Trips')} value={String(itineraries.length)} onClick={() => setSheet('trips')} />
        <Item icon={<Wallet size={19} />} color="#FFB400" iconFg="#2B130A" label={t('Kagustuhan sa badyet', 'Budget preferences')} value={`${peso(prefs.dailyBudget)}/${t('araw', 'day')}`} onClick={() => navigate('/personalize/budget?from=prefs')} />
      </Group>

      <Group title={t('Aplikasyon', 'App')}>
        <Item icon={<Globe size={19} />} color="#0B7F96" label={lang === 'en' ? 'Language' : 'Wika'} value={lang === 'en' ? 'English' : 'Tagalog'} onClick={() => setSheet('lang')} />
        <li className="flex flex-col gap-2.5 px-4 py-3">
          <div className="flex items-center gap-3">
            <IconTile color="#6B3A22">
              <Palette size={19} />
            </IconTile>
            <span className="text-body">{t('Itsura', 'Appearance')}</span>
          </div>
          <Segmented<ThemeMode>
            label={t('Itsura', 'Appearance')}
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
        <Item icon={<Database size={19} />} color="#B26A00" label={t('Pagtitipid ng datos', 'Data saver')} sub={t('Hindi awtomatikong magpe-play ang Reels gamit ang mobile data', 'No autoplay for Reels on mobile data')} trailing={<Toggle label={t('Pagtitipid ng datos', 'Data saver')} checked={dataSaver} onChange={setDataSaver} />} />
        <Item icon={<Captions size={19} />} color="#3A1A0E" label={t('Mga caption sa Tagalog sa Reels', 'Captions on Reels')} trailing={<Toggle label={t('Mga caption', 'Captions')} checked={subtitles} onChange={setSubtitles} />} />
        <Item icon={<Bell size={19} />} color="#C2185B" label={t('Mga abiso', 'Notifications')} onClick={() => setSheet('notif')} />
        <Item icon={<Lock size={19} />} color="#1B8A3A" label={t('Pagkapribado', 'Privacy')} onClick={() => navigate('/personalize/privacy?from=prefs')} />
        <Item icon={<ShieldCheck size={19} />} color="#0B7F96" label={t('Seguridad ng account', 'Account security')} sub={t('Password at seguridad ng account', 'Password and account security')} onClick={() => setSheet('security')} />
      </Group>

      <Group>
        <Item icon={<HelpCircle size={19} />} color="#C84A00" label={t('Tulong', 'Help')} onClick={() => setSheet('help')} />
        <Item
          icon={<LogOut size={19} />}
          color="#D32F2F"
          label={guest ? t('Lumabas sa panauhin mode', 'Exit guest mode') : t('Mag-log out', 'Log out')}
          danger
          onClick={async () => {
            const result = await signOut()
            if (result.error) showToast({ text: result.error })
            if (result.signedOut) navigate('/splash', { replace: true })
          }}
        />
      </Group>
      <p className="mt-6 text-center text-caption text-fg-2">{t('Bitinary v1.0 · Ginawa sa Pilipinas', 'Bitinary v1.0 · Made in the Philippines')}</p>

      <Sheet open={sheet === 'saved'} onClose={() => setSheet(null)} title={t('Naka-save', 'Saved')}>
        <div className="space-y-2.5">
          {places.filter((p) => saved.includes(p.id)).map((p) => (
            <ListingCard key={p.id} place={p} layout="row" />
          ))}
          {!saved.length && <p className="py-6 text-center text-body text-fg-2">{t('Wala pang naka-save.', 'Nothing saved yet.')}</p>}
        </div>
      </Sheet>
      <Sheet open={sheet === 'trips'} onClose={() => setSheet(null)} title={t('Mga biyahe', 'Trips')}>
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
      <Sheet open={sheet === 'notif'} onClose={() => setSheet(null)} title={t('Mga abiso', 'Notifications')}>
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
      <Sheet open={sheet === 'help'} onClose={() => setSheet(null)} title={t('Tulong', 'Help')}>
        <div className="flex items-center gap-3 rounded-2xl bg-sunken p-3 dark:bg-elevated">
          <Jimbot crop="head" size={44} expression="pointing" animate={false} />
          <p className="text-body">{t('Maaari mo ring tanungin si Jimbot ng “Tulong” anumang oras.', 'You can also ask Jimbot for “Help” at any time.')}</p>
        </div>
        <Button block className="mt-4" onClick={() => navigate('/jimbot')}>
          {t('Kausapin si Jimbot', 'Talk to Jimbot')}
        </Button>
      </Sheet>
      <Sheet open={sheet === 'security'} onClose={() => { setSheet(null); clearPasswordForm() }} title={t('Seguridad ng account', 'Account security')}>
        {guest ? (
          <div className="space-y-3">
            <p className="text-body text-fg-2">{t('Mag-sign in muna upang mapamahalaan ang seguridad ng account.', 'Sign in first to manage your account security.')}</p>
            <Button block onClick={() => navigate('/auth?mode=login')}>{t('Mag-sign in', 'Sign in')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-sunken p-3 text-caption text-fg-2 dark:bg-elevated">
              <p className="font-semibold text-fg">{t('Naka-sign in bilang', 'Signed in as')}</p>
              <p>{profile.email || 'Email account'}</p>
            </div>
            {requiresCurrentPassword ? (
              <PasswordField label={t('Kasalukuyang password', 'Current password')} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            ) : (
              <p className="text-caption text-fg-2">{t('Naka-sign in ka gamit ang Google. Magtakda ng password para makapag-sign in ka rin gamit ang email.', 'You are signed in with Google. Set a password to also sign in with email.')}</p>
            )}
            <PasswordField label={t('Bagong password', 'New password')} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <PasswordField label={t('Kumpirmahin ang password', 'Confirm password')} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            {passwordError && <p role="alert" className="text-caption text-danger">{passwordError}</p>}
            {securityMessage && <p role="status" className="text-caption text-fg-2">{securityMessage}</p>}
            <Button
              block
              disabled={passwordBusy || newPassword.length < 8 || newPassword !== confirmPassword || (requiresCurrentPassword && !currentPassword)}
              onClick={async () => {
                setPasswordBusy(true)
                setPasswordError(null)
                try {
                  const result = await updatePassword(newPassword, requiresCurrentPassword ? currentPassword : undefined)
                  if (result.error) {
                    setPasswordError(result.error)
                    return
                  }
                  setSecurityMessage(t('Na-update na ang password ng account.', 'Account password updated.'))
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                } catch (updateError: unknown) {
                  setPasswordError(updateError instanceof Error ? updateError.message : 'Could not update the password.')
                } finally {
                  setPasswordBusy(false)
                }
              }}
            >
              {passwordBusy ? t('Sine-save…', 'Saving…') : t('I-update ang password', 'Update password')}
            </Button>
          </div>
        )}
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
