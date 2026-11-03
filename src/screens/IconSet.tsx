import { Plane, ShieldCheck, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { emptyBusiness, type DayHours, type MenuItem } from '@/app/account'
import { useLang } from '@/app/i18n'
import { FoxIcon } from '@/components/icons/TabIcons'
import { Jimbot, JimbotAvatar, expressionLabel, expressions, isPlaceholder, officialExpressions } from '@/components/mascot/Jimbot'
import { GoLivePreviewCard, HoursPicker, MapPinDropper, MenuRows } from '@/components/onboarding/BizWidgets'
import { BigSkip, CompletenessRing, JimbotTip, OptTag, PriceChips, Question, ReqTag, StatusChip, StepDots, ThemeCard } from '@/components/onboarding/Kit'
import { Button } from '@/components/ui/Button'

const use: Record<string, [string, string]> = {
  waving: ['Hello', 'Splash, welcome, login, greetings, home header'],
  pointing: ['Directions', 'Location permission, near-me, check-in, map tips, "Nandito ka na"'],
  idea: ['Idea', 'Jimbot suggestions, tips, customization intros, "Did you know"'],
  celebrating: ['Celebrate', 'Account created, trip saved, checked in, business live, review posted'],
  thinking: ['Thinking', 'Loading, Jimbot is working on a plan'],
  unsure: ['Unsure', 'No verified data, empty search'],
  sleeping: ['Sleeping / Offline', 'Offline states'],
  camera: ['Holding a camera', 'Photos, Moments, menu scan'],
}

const base = import.meta.env.BASE_URL

function Tile({ title, children, sub }: { title: string; children: ReactNode; sub?: string }) {
  return (
    <figure className="flex flex-col items-center gap-2 rounded-[20px] bg-surface p-4 text-center shadow-card dark:bg-elevated/50">
      <div className="flex min-h-[120px] items-center justify-center">{children}</div>
      <figcaption>
        <p className="font-display text-[14px] font-semibold">{title}</p>
        {sub && <p className="text-[12px] text-fg-2">{sub}</p>}
      </figcaption>
    </figure>
  )
}

/** Jimbot icon set: official poses, temporary poses, app/PWA icons, tab icon, avatars. */
export function MascotSheet() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-6 text-fg md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Jimbot crop="head" shape="squircle" size={52} />
            <div>
              <h1 className="text-title">Jimbot icon set</h1>
              <p className="text-body text-fg-2">Official artwork used as supplied. Temporary poses are marked.</p>
            </div>
          </div>
          <Link to="/screens">
            <Button variant="secondary">← Screen Index</Button>
          </Link>
        </header>

        <h2 className="mt-8 text-h2">Official poses</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {officialExpressions.map((e) => (
            <Tile key={e} title={`${use[e][0]} · ${e}`} sub={use[e][1]}>
              <Jimbot expression={e} variant="standalone" size={170} />
            </Tile>
          ))}
        </div>

        <h2 className="mt-8 flex items-center gap-2 text-h2">
          Temporary poses <span className="rounded-full bg-caution-bg px-3 py-1 font-display text-[13px] font-semibold text-caution">To be replaced by final artwork</span>
        </h2>
        <p className="mt-1 text-body text-fg-2">Composited from the official art with flat props in the same outline and palette.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {expressions.filter(isPlaceholder).map((e) => (
            <Tile key={e} title={use[e][0]} sub={use[e][1]}>
              <div className="relative">
                <Jimbot expression={e} variant="standalone" size={170} />
                <span className="absolute -right-1 top-0 rotate-6 rounded-md border-2 border-dashed border-caution bg-caution-bg px-1.5 py-0.5 font-display text-[10px] font-bold uppercase text-caution">Placeholder</span>
              </div>
            </Tile>
          ))}
        </div>

        <h2 className="mt-8 text-h2">App and PWA icons</h2>
        <p className="mt-1 text-body text-fg-2">Head of the Hello pose on a vivid orange rounded square. Files in /public/icons.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
          <Tile title="512 · icon-512.png">
            <img src={`${base}icons/icon-512.png`} alt="" width={120} height={120} />
          </Tile>
          <Tile title="Maskable 512" sub="80% safe zone shown">
            <div className="relative h-[120px] w-[120px] overflow-hidden rounded-[30px]">
              <img src={`${base}icons/icon-maskable-512.png`} alt="" className="h-full w-full" />
              <span className="absolute inset-[10%] rounded-full border-2 border-dashed border-white/90" />
            </div>
          </Tile>
          <Tile title="192 · icon-192.png">
            <img src={`${base}icons/icon-192.png`} alt="" width={96} height={96} />
          </Tile>
          <Tile title="180 · Apple touch">
            <img src={`${base}icons/apple-touch-icon.png`} alt="" width={90} height={90} className="rounded-[20px]" />
          </Tile>
          <Tile title="32 · favicon">
            <img src={`${base}icons/favicon-32.png`} alt="" width={32} height={32} />
          </Tile>
          <Tile title="16 · favicon">
            <img src={`${base}icons/favicon-16.png`} alt="" width={16} height={16} />
          </Tile>
        </div>

        <h2 className="mt-8 text-h2">UI icons</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile title="Jimbot tab icon" sub="Hat + ears silhouette, 24px. Outline inactive, filled active">
            <div className="flex items-center gap-4">
              <span className="text-muted">
                <FoxIcon />
              </span>
              <span className="flex h-[54px] w-[64px] items-center justify-center rounded-[24px] bg-primary text-ink">
                <FoxIcon active />
              </span>
              <span className="text-fg">
                <FoxIcon size={48} />
              </span>
            </div>
          </Tile>
          <Tile title="Chat avatar · 40px" sub="Round face crop of the Hello pose">
            <div className="flex items-center gap-3">
              <JimbotAvatar size={40} />
              <p className="rounded-[18px] rounded-tl-md bg-sunken px-3 py-2 text-left text-[14px] dark:bg-elevated">Kumusta!</p>
            </div>
          </Tile>
          <Tile title="Notification badge · 24px">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-[14px] bg-sunken dark:bg-elevated">
              <span className="font-display text-[20px] font-bold text-muted">B</span>
              <JimbotAvatar size={24} className="absolute -right-1.5 -top-1.5 ring-2 ring-surface" />
            </div>
          </Tile>
          <Tile title="Section icons">
            <div className="flex gap-2">
              {(['waving', 'pointing', 'idea', 'celebrating'] as const).map((e) => (
                <Jimbot key={e} crop="head" expression={e} size={44} animate={false} />
              ))}
            </div>
          </Tile>
        </div>
        <p className="mt-6 text-caption text-fg-2">Labels: {expressions.map((e) => `${e} = ${expressionLabel[e]}`).join(' · ')}</p>
      </div>
    </main>
  )
}

const demoHours = emptyBusiness.hours as Record<string, DayHours>

/** Live demo of the onboarding components, for the Component sheet. */
export function OnboardingKitDemo() {
  const { lang } = useLang()
  const [price, setPrice] = useState('₱₱')
  const [pin, setPin] = useState<{ x: number; y: number } | undefined>({ x: 48, y: 52 })
  const [hours, setHours] = useState(demoHours)
  const [menu, setMenu] = useState<MenuItem[]>([{ id: 'x', name: 'Sisig', price: '180', category: 'Ulam' }])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ThemeCard icon={Plane} title="Huling Biyahe" minutes={1} onClick={() => {}} />
        <ThemeCard icon={Wallet} title="Budget" minutes={1} status="done" onClick={() => {}} />
        <ThemeCard icon={ShieldCheck} title="Privacy" minutes={1} status="skipped" tag="optional" onClick={() => {}} />
        <ThemeCard icon={Plane} title="Negosyo" minutes={1} tag="required" active onClick={() => {}} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <CompletenessRing value={0.38} caption="3/8" />
        <StepDots total={5} current={3} />
        <ReqTag />
        <OptTag />
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusChip status="draft" />
        <StatusChip status="live" />
        <StatusChip status="verified" />
      </div>
      <BigSkip onClick={() => {}} />
      <JimbotTip>Alam mo ba? Mas mura ang kain sa labas ng mall.</JimbotTip>
      <Question n={1} title="Price range" tag="required">
        <PriceChips value={price} onChange={setPrice} hints={{ '₱': lang === 'en' ? 'Under ₱200' : 'Wala pang ₱200', '₱₱': '₱200–600', '₱₱₱': '₱600+' }} />
      </Question>
      <MapPinDropper value={pin} onChange={setPin} />
      <HoursPicker value={hours as typeof emptyBusiness.hours} onChange={(h) => setHours(h)} />
      <MenuRows items={menu} onChange={setMenu} categories={['Ulam', 'Merienda', 'Inumin']} />
      <GoLivePreviewCard b={{ ...emptyBusiness, name: 'Kapihan ni Aling Nena', type: 'kapihan', price: '₱', city: 'Maynila', menu }} />
    </div>
  )
}
