import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { places, type Place } from '@/data/places'
import { promos, sponsored } from '@/data/promos'
import { usePersistentState } from '@/lib/usePersistentState'
import type { Verification } from '@/lib/verify'

/* ------------------------------ Types ------------------------------ */

export type Placement = 'home-carousel' | 'home-sponsored' | 'search' | 'profile' | 'biz-bar'
export type Audience = 'all' | 'guests' | 'travelers' | 'business'
export type BannerLink = { kind: 'place'; placeId: string } | { kind: 'route'; path: string } | { kind: 'url'; url: string }
export type Banner = {
  id: string
  name: string
  placement: Placement
  status: 'draft' | 'live' | 'paused'
  title: string
  subtitle: string
  cta: string
  /** Unsplash photo id or uploaded data URL */
  image?: string
  tone: 'orange' | 'brown' | 'amber'
  link: BannerLink
  audience: Audience
  start?: string
  end?: string
  /** lower shows first */
  priority: number
  sponsor?: string
  /** small tag text, e.g. "Hanggang Nob 30" */
  label?: string
  /** carousel only: 'image' fills the slide with the picture (its text is in the image) */
  style?: 'promo' | 'image'
  /** focus point for image slides, in percent */
  focus?: { x: number; y: number }
  /** describes an image slide for screen readers */
  alt?: string
  stats: { views: number; clicks: number }
  createdAt: string
}

export type Palette = { primary: string; bg: string; surface: string; fg: string; link: string }
export type ThemeConfig = {
  preset: string
  light: Palette & { brown: string }
  dark: Palette
  fontDisplay: string
  fontBody: string
  corners: 'sharp' | 'default' | 'round'
}

export type FlagId = 'reels' | 'moments' | 'jimbot' | 'reviews' | 'comments' | 'menuScan' | 'deals' | 'install'
export const FLAGS: { id: FlagId; label: string; description: string }[] = [
  { id: 'reels', label: 'Reels', description: 'Reels row on Home and video posts on business profiles.' },
  { id: 'moments', label: 'Moments', description: 'The Moments tab (camera, map and gallery).' },
  { id: 'jimbot', label: 'Jimbot AI chat', description: 'The Jimbot tab and the "Ask Jimbot" card in the sidebar.' },
  { id: 'reviews', label: 'Writing reviews', description: 'Travelers can write and edit reviews on business profiles.' },
  { id: 'comments', label: 'Comments', description: 'Travelers can comment on business posts. Off = read-only.' },
  { id: 'menuScan', label: 'Menu Scan', description: 'Menu Scan entry points in Bitinary Business.' },
  { id: 'deals', label: 'Deals on ads', description: 'Deal buttons on sponsored posts.' },
  { id: 'install', label: 'Install banner', description: 'The "Install Bitinary" card on Home.' },
]

export type Announcement = { id: string; on: boolean; text: string; tone: 'info' | 'caution' | 'promo'; target: 'all' | 'traveler' | 'biz'; link?: string }
export type LogEntry = { id: string; at: string; area: string; action: string; target?: string; /** developer who did it */ by?: string }
export type Removed = { id: string; kind: 'review' | 'comment'; reason: string; at: string; by?: string }

/** A /bitinarydev developer. All accounts are equal (no roles). */
export type DevAccount = {
  id: string
  name: string
  email: string
  salt: string
  /** SHA-256(salt + password), hex */
  hash: string
  /** using a default or temporary password; must set their own on next sign-in */
  mustChange: boolean
  active: boolean
  createdAt: string
  createdBy?: string
  lastSignIn?: string
}
export type DevSession = { accountId: string; at: number; lastActive: number }

export type ConsoleData = {
  devAccounts: DevAccount[]
  devSession: DevSession | null
  /** wrong-password counter per email */
  devFails: Record<string, { count: number; until: number }>
  banners: Banner[]
  theme: ThemeConfig
  /** unsaved edits from the theme editor, shown only in its preview frame */
  themeDraft?: ThemeConfig
  savedPresets: (ThemeConfig & { name: string })[]
  flags: Record<FlagId, boolean>
  announcement: Announcement
  maintenance: { on: boolean; message: string; until?: string }
  suspended: string[]
  roleOverrides: Record<string, 'traveler' | 'business'>
  removed: Removed[]
  hiddenPlaces: string[]
  featuredPlaces: string[]
  /** reviewer edits to sample businesses' verification (the /biz business keeps its own) */
  verifications: Record<string, Verification>
  log: LogEntry[]
}

/* ------------------------------ Defaults ------------------------------ */

export const DEMO_DEV_EMAIL = 'dev@bitinary.ph'
/** Console id for the Bitinary Business owner signed in on this device. */
export const BIZ_OWNER_ID = 'biz-owner'
export const IDLE_MS = 30 * 60 * 1000

export const defaultTheme: ThemeConfig = {
  preset: 'bitinary',
  light: { primary: '#ff6a00', bg: '#fff1e3', surface: '#ffffff', fg: '#3a1a0e', link: '#c84a00', brown: '#3a1a0e' },
  dark: { primary: '#ff7a1a', bg: '#1a0d07', surface: '#2a150c', fg: '#fff1e3', link: '#ff9a4d' },
  fontDisplay: 'Poppins',
  fontBody: 'Open Sans',
  corners: 'default',
}

export const PRESETS: (ThemeConfig & { name: string })[] = [
  { ...defaultTheme, name: 'Bitinary Orange' },
  { preset: 'pasko', name: 'Pasko', light: { primary: '#d62828', bg: '#fdf3ec', surface: '#ffffff', fg: '#1f2b1a', link: '#1b7a3a', brown: '#1f3a24' }, dark: { primary: '#ff5a4f', bg: '#0f1a12', surface: '#18271b', fg: '#fdf3ec', link: '#7fd99a' }, fontDisplay: 'Poppins', fontBody: 'Open Sans', corners: 'round' },
  { preset: 'independence', name: 'Independence Day', light: { primary: '#fcd116', bg: '#f3f6fd', surface: '#ffffff', fg: '#0b1f4d', link: '#0038a8', brown: '#0b1f4d' }, dark: { primary: '#fcd116', bg: '#0a1330', surface: '#122049', fg: '#f3f6fd', link: '#7fa6ff' }, fontDisplay: 'Montserrat', fontBody: 'Open Sans', corners: 'default' },
  { preset: 'sinag', name: 'Sinag', light: { primary: '#ffb400', bg: '#fff8e6', surface: '#ffffff', fg: '#3b2a05', link: '#9a6400', brown: '#3b2a05' }, dark: { primary: '#ffc23d', bg: '#1a1404', surface: '#2a200a', fg: '#fff8e6', link: '#ffd27a' }, fontDisplay: 'Nunito', fontBody: 'Nunito Sans', corners: 'round' },
  { preset: 'dagat', name: 'Dagat', light: { primary: '#14b8a6', bg: '#effaf8', surface: '#ffffff', fg: '#0d2f2c', link: '#0f766e', brown: '#0d2f2c' }, dark: { primary: '#2dd4bf', bg: '#061a18', surface: '#0d2a27', fg: '#effaf8', link: '#5eead4' }, fontDisplay: 'DM Sans', fontBody: 'Inter', corners: 'sharp' },
]

export const DISPLAY_FONTS = ['Poppins', 'Montserrat', 'Nunito', 'DM Sans', 'Rubik', 'Baloo 2', 'Playfair Display']
export const BODY_FONTS = ['Open Sans', 'Inter', 'Nunito Sans', 'Lato', 'Source Sans 3', 'Roboto']

const now = () => new Date().toISOString()

/** The banners that used to be hard-coded on Home, so nothing changes until the team edits them. */
const seedBanners: Banner[] = [
  ...promos.map<Banner>((p, i) => ({ id: `bn-${p.id}`, name: p.title, placement: 'home-carousel', status: 'live', title: p.title, subtitle: p.subtitle, cta: p.cta, image: p.image, tone: p.tone, link: { kind: 'place', placeId: p.placeId }, audience: 'all', priority: i, sponsor: p.placeId, stats: { views: 420 - i * 60, clicks: 38 - i * 5 }, createdAt: now(), label: p.until })),
  ...sponsored.map<Banner>((a, i) => ({ id: `bn-${a.id}`, name: a.headline, placement: 'home-sponsored', status: 'live', title: a.headline, subtitle: a.body, cta: a.cta, tone: 'brown', link: { kind: 'place', placeId: a.placeId }, audience: 'all', priority: i, sponsor: a.placeId, stats: { views: 980 - i * 200, clicks: 61 - i * 12 }, createdAt: now() })),
]

const seedAt = '2026-01-05T09:00:00.000Z'
/** Hashes precomputed for Bitinary2026! (demo owner) and Welcome2026! (teammates). */
export const seedDevAccounts: DevAccount[] = [
  { id: 'dev-main', name: 'Bitinary Dev', email: DEMO_DEV_EMAIL, salt: 'b1t1nary-dev-salt', hash: '85f753c0379d0cad5958528ad47e37c5ddfddbf4bf2b098c9ae0b9ccee98c076', mustChange: true, active: true, createdAt: seedAt },
  { id: 'dev-carla', name: 'Carla Mendoza', email: 'carla@bitinary.ph', salt: 'c4rla-salt-01', hash: '2941ce68fe790af306dde1685992429eb02728c41c2b517a7b760890bd6a71a9', mustChange: true, active: true, createdAt: seedAt, createdBy: 'dev-main' },
  { id: 'dev-paolo', name: 'Paolo Reyes', email: 'paolo@bitinary.ph', salt: 'pa0lo-salt-02', hash: 'c8e72fce8a8c4e91907d7a40b16866b4be3e42373c5bb1878d99f0d7768b92e6', mustChange: true, active: true, createdAt: seedAt, createdBy: 'dev-main' },
]

export const initialConsole: ConsoleData = {
  devAccounts: seedDevAccounts,
  devSession: null,
  devFails: {},
  banners: seedBanners,
  theme: defaultTheme,
  savedPresets: [],
  flags: { reels: true, moments: true, jimbot: true, reviews: true, comments: true, menuScan: true, deals: true, install: true },
  announcement: { id: 'a0', on: false, text: '', tone: 'info', target: 'all' },
  maintenance: { on: false, message: 'Nag-aayos kami ng app para mas gumanda pa. Babalik kami agad!' },
  suspended: [],
  roleOverrides: {},
  removed: [],
  hiddenPlaces: [],
  featuredPlaces: [],
  verifications: {},
  log: [],
}

/* ------------------------------ Provider ------------------------------ */

type Ctx = {
  c: ConsoleData
  /** Update console data; pass `log` to record it in the activity log. */
  update: (fn: (c: ConsoleData) => ConsoleData, log?: { area: string; action: string; target?: string }) => void
}
const C = createContext<Ctx | null>(null)

/** Fill fields that older saves miss; drop the old shared-PIN fields. */
function normalize(x: Partial<ConsoleData> & Record<string, unknown>): ConsoleData {
  const { pin: _pin, unlockedAt: _u, fails: _f, lockedUntil: _l, ...rest } = x as Record<string, unknown>
  const r = rest as Partial<ConsoleData>
  return { ...initialConsole, ...r, devAccounts: r.devAccounts?.length ? r.devAccounts : seedDevAccounts, devFails: r.devFails ?? {}, flags: { ...initialConsole.flags, ...r.flags } }
}

const previewFrame = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('themePreview')

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistentState<ConsoleData>('console', initialConsole)
  // Older saves may miss newer fields.
  const c = useMemo<ConsoleData>(() => normalize(stored), [stored])

  // Other tabs and the theme-preview iframe follow console changes live via usePersistentState.

  const update = useCallback<Ctx['update']>(
    (fn, log) =>
      setStored((x) => {
        const cur = normalize(x)
        const next = fn(cur)
        // Stamp who did it from the session that was active when the action ran.
        const by = cur.devAccounts.find((a) => a.id === cur.devSession?.accountId)?.name
        return log ? { ...next, log: [{ id: `l${Date.now()}${Math.random().toString(36).slice(2, 5)}`, at: now(), by, ...log }, ...next.log].slice(0, 200) } : next
      }),
    [setStored],
  )
  return (
    <C.Provider value={{ c, update }}>
      <ThemeOverrides theme={previewFrame && c.themeDraft ? c.themeDraft : c.theme} />
      {children}
    </C.Provider>
  )
}

export function useConsole() {
  const x = useContext(C)
  if (!x) throw new Error('useConsole outside ConsoleProvider')
  return x
}

export const useFlag = (id: FlagId) => useConsole().c.flags[id] !== false

export function useAnnouncement(target: 'traveler' | 'biz') {
  const a = useConsole().c.announcement
  return a.on && a.text.trim() && (a.target === 'all' || a.target === target) ? a : null
}

/** The signed-in developer, or null when signed out, idle too long, or turned off. */
export function currentDev(c: ConsoleData): DevAccount | null {
  const s = c.devSession
  if (!s || Date.now() - s.lastActive > IDLE_MS) return null
  const a = c.devAccounts.find((x) => x.id === s.accountId)
  return a && a.active ? a : null
}
export const isSignedIn = (c: ConsoleData) => !!currentDev(c)
export const useCurrentDev = () => currentDev(useConsole().c)

/* ------------------------------ Banners ------------------------------ */

export function bannerActive(b: Banner, at = Date.now()) {
  if (b.status !== 'live') return false
  if (b.start && new Date(b.start).getTime() > at) return false
  if (b.end && new Date(b.end).getTime() + 864e5 <= at) return false
  if (b.link.kind === 'place' && !places.some((p) => p.id === (b.link as { placeId: string }).placeId)) return false
  return true
}

export type Viewer = 'guests' | 'travelers' | 'business'

/** Live banners for a placement, for this kind of viewer, in priority order. */
export function useBanners(placement: Placement, viewer: Viewer) {
  const { c, update } = useConsole()
  const list = useMemo(
    () => c.banners.filter((b) => b.placement === placement && bannerActive(b) && (b.audience === 'all' || b.audience === viewer) && !(b.link.kind === 'place' && c.hiddenPlaces.includes(b.link.placeId))).sort((a, b) => a.priority - b.priority),
    [c.banners, c.hiddenPlaces, placement, viewer],
  )
  const bump = useCallback((id: string, key: 'views' | 'clicks') => update((x) => ({ ...x, banners: x.banners.map((b) => (b.id === id ? { ...b, stats: { ...b.stats, [key]: b.stats[key] + 1 } } : b)) })), [update])
  return { list, trackClick: (id: string) => bump(id, 'clicks'), trackView: bump }
}

const seen = new Set<string>()
/** Count one view per banner per page load. */
export function useTrackView(id: string | undefined, track: (id: string, key: 'views') => void) {
  useEffect(() => {
    if (!id || seen.has(id) || new URLSearchParams(location.search).has('embed')) return
    seen.add(id)
    track(id, 'views')
  }, [id, track])
}

/* ------------------------------ Places ------------------------------ */

/** Places the app may show: hidden ones removed, featured ones first. */
export function useVisiblePlaces(): Place[] {
  const { hiddenPlaces, featuredPlaces } = useConsole().c
  return useMemo(() => {
    const list = places.filter((p) => !hiddenPlaces.includes(p.id))
    return [...list.filter((p) => featuredPlaces.includes(p.id)), ...list.filter((p) => !featuredPlaces.includes(p.id))]
  }, [hiddenPlaces, featuredPlaces])
}

/* ------------------------------ Theme ------------------------------ */

const hex = (h: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}
export const validHex = (h: string) => !!hex(h)
/** Mix two colors; `t` is the share of `b`. */
export function mix(a: string, b: string, t: number) {
  const x = hex(a)
  const y = hex(b)
  if (!x || !y) return a
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}
function luminance(h: string) {
  const c = hex(h)
  if (!c) return 0
  const [r, g, b] = c.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const corners = { sharp: ['12px', '18px'], default: ['20px', '28px'], round: ['28px', '36px'] } as const

export function themeCss(t: ThemeConfig) {
  const L = t.light
  const D = t.dark
  const [rc, rs] = corners[t.corners]
  return `:root,[data-theme='light']{--c-primary:${L.primary};--c-primary-press:${mix(L.primary, '#000000', 0.09)};--c-link:${L.link};--c-fg:${L.fg};--c-fg-2:${mix(L.fg, L.bg, 0.28)};--c-muted:${mix(L.fg, L.bg, 0.55)};--c-line:${mix(L.bg, L.fg, 0.1)};--c-bg:${L.bg};--c-surface:${L.surface};--c-elevated:${L.surface};--c-sunken:${mix(L.bg, L.primary, 0.07)};--c-brown:${L.brown};--f-display:'${t.fontDisplay}',ui-sans-serif,system-ui,sans-serif;--f-body:'${t.fontBody}',ui-sans-serif,system-ui,sans-serif;--r-card:${rc};--r-sheet:${rs}}
[data-theme='dark']{--c-primary:${D.primary};--c-primary-press:${mix(D.primary, '#ffffff', 0.12)};--c-link:${D.link};--c-fg:${D.fg};--c-fg-2:${mix(D.fg, D.bg, 0.25)};--c-muted:${mix(D.fg, D.bg, 0.45)};--c-line:${mix(D.surface, D.fg, 0.12)};--c-bg:${D.bg};--c-surface:${D.surface};--c-elevated:${mix(D.surface, D.fg, 0.06)};--c-sunken:${mix(D.bg, D.fg, 0.03)}}`
}

const sameTheme = (a: ThemeConfig, b: ThemeConfig) => JSON.stringify({ ...a, preset: '' }) === JSON.stringify({ ...b, preset: '' })

function ThemeOverrides({ theme }: { theme: ThemeConfig }) {
  useEffect(() => {
    const custom = !sameTheme(theme, defaultTheme)
    let style = document.getElementById('bitinary-theme') as HTMLStyleElement | null
    let link = document.getElementById('bitinary-fonts') as HTMLLinkElement | null
    if (!custom) {
      style?.remove()
      link?.remove()
      return
    }
    if (!style) {
      style = document.createElement('style')
      style.id = 'bitinary-theme'
      document.head.appendChild(style)
    }
    style.textContent = themeCss(theme)
    const fams = [theme.fontDisplay, theme.fontBody].filter((f) => f !== 'Poppins' && f !== 'Open Sans')
    if (fams.length) {
      if (!link) {
        link = document.createElement('link')
        link.id = 'bitinary-fonts'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`
    } else link?.remove()
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = document.documentElement.dataset.theme === 'dark' ? theme.dark.bg : theme.light.primary
  }, [theme])
  return null
}
