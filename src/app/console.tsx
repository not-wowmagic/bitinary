import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { places, type Place } from '@/data/places'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

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
  active: boolean
  createdAt: string
  createdBy?: string
  lastSignIn?: string
}
export type DevSession = { accountId: string; at: number; lastActive: number }

export type ConsoleData = {
  devAccounts: DevAccount[]
  devSession: DevSession | null
  banners: Banner[]
  theme: ThemeConfig
  /** unsaved edits from the theme editor, shown only in its preview frame */
  themeDraft?: ThemeConfig
  savedPresets: (ThemeConfig & { name: string })[]
  flags: Record<FlagId, boolean>
  announcement: Announcement
  maintenance: { on: boolean; message: string; until?: string }
  suspended: string[]
  removed: Removed[]
  hiddenPlaces: string[]
  featuredPlaces: string[]
  log: LogEntry[]
}

/* ------------------------------ Defaults ------------------------------ */

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

export const initialConsole: ConsoleData = {
  devAccounts: [],
  devSession: null,
  banners: [],
  theme: defaultTheme,
  savedPresets: [],
  flags: { reels: true, moments: true, jimbot: true, reviews: true, comments: true, menuScan: true, deals: true, install: true },
  announcement: { id: 'announcement', on: false, text: '', tone: 'info', target: 'all' },
  maintenance: { on: false, message: 'Maintenance in progress. Please check back soon.' },
  suspended: [],
  removed: [],
  hiddenPlaces: [],
  featuredPlaces: [],
  log: [],
}

/* ------------------------------ Provider ------------------------------ */

type Ctx = {
  c: ConsoleData
  ready: boolean
  dataError: string | null
  /** Update console data; pass `log` to record it in the activity log. */
  update: (fn: (c: ConsoleData) => ConsoleData, log?: { area: string; action: string; target?: string }) => Promise<void>
}
const C = createContext<Ctx | null>(null)

/** Fill fields that are missing from older database records. */
function normalize(x: Partial<ConsoleData> & Record<string, unknown>): ConsoleData {
  const {
    devAccounts: _devAccounts,
    devSession: _devSession,
    roleOverrides: _roleOverrides,
    verifications: _verifications,
    ...rest
  } = x
  const saved = rest as Partial<ConsoleData>
  return {
    ...initialConsole,
    ...saved,
    devAccounts: [],
    devSession: null,
    flags: { ...initialConsole.flags, ...saved.flags },
  }
}

const previewFrame = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('themePreview')

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [c, setC] = useState(initialConsole)
  const [ready, setReady] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const stateRef = useRef(c)
  const readyRef = useRef(false)
  const adminRef = useRef(false)
  const sessionRef = useRef<Session | null>(null)
  const loadingSessionIdRef = useRef<string | null | undefined>(undefined)
  const loadedSessionIdRef = useRef<string | null | undefined>(undefined)
  const revisionRef = useRef(0)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveResolversRef = useRef<Array<() => void>>([])

  const loadConsole = useCallback(async (session: Session | null) => {
    const sessionId = session?.user.id ?? null
    if (loadingSessionIdRef.current === sessionId || (readyRef.current && loadedSessionIdRef.current === sessionId)) return

    const revision = ++revisionRef.current
    loadingSessionIdRef.current = sessionId
    readyRef.current = false
    setReady(false)
    setDataError(null)
    sessionRef.current = session

    try {
      let next = initialConsole
      adminRef.current = false
      if (session) {
        const { data: admin, error: adminError } = await supabase.rpc('is_dev_console_admin')
        if (adminError) throw adminError
        if (admin) {
          const { data: row, error: stateError } = await supabase.from('dev_console_state').select('data').eq('id', 1).maybeSingle()
          if (stateError) throw stateError
          next = normalize((row?.data ?? {}) as Partial<ConsoleData> & Record<string, unknown>)
          adminRef.current = true
        } else {
          const { data: publicState, error: publicError } = await supabase.rpc('get_public_dev_console_settings')
          if (publicError) throw publicError
          next = normalize((publicState ?? {}) as Partial<ConsoleData> & Record<string, unknown>)
        }
      } else {
        const { data: publicState, error: publicError } = await supabase.rpc('get_public_dev_console_settings')
        if (publicError) throw publicError
        next = normalize((publicState ?? {}) as Partial<ConsoleData> & Record<string, unknown>)
      }

      if (revision !== revisionRef.current) return
      const activeId = session?.user.id
      const previousSession = stateRef.current.devSession
      const currentDeveloper = activeId
        ? stateRef.current.devAccounts.filter((account) => account.id === activeId)
        : []
      next = {
        ...next,
        devAccounts: currentDeveloper,
        devSession: previousSession?.accountId === activeId ? previousSession : null,
      }
      stateRef.current = next
      setC(next)
    } catch (reason) {
      if (revision !== revisionRef.current) return
      adminRef.current = false
      const message = reason instanceof Error ? reason.message : 'Unable to load developer-console data.'
      setDataError(message)
    } finally {
      if (revision === revisionRef.current) {
        loadedSessionIdRef.current = sessionId
        loadingSessionIdRef.current = undefined
        readyRef.current = true
        setReady(true)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.removeItem('bitinary:console')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return
      window.setTimeout(() => void loadConsole(session), 0)
    })
    return () => {
      revisionRef.current++
      subscription.unsubscribe()
    }
  }, [loadConsole])

  useEffect(() => {
    stateRef.current = c
  }, [c])

  useEffect(() => {
    if (!ready || !adminRef.current) return
    const channel = supabase
      .channel('dev-console-state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dev_console_state', filter: 'id=eq.1' }, (payload) => {
        const remote = normalize(payload.new.data as Partial<ConsoleData> & Record<string, unknown>)
        remote.devAccounts = stateRef.current.devAccounts
        remote.devSession = stateRef.current.devSession
        stateRef.current = remote
        setC(remote)
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setDataError('Live console sync could not connect. Reload to fetch the latest saved data.')
      })
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [ready])

  const update = useCallback<Ctx['update']>((fn, log) => {
    const cur = stateRef.current
    const next = fn(cur)
    const by = cur.devAccounts.find((account) => account.id === cur.devSession?.accountId)?.name
    const withLog = log
      ? { ...next, log: [{ id: `l${Date.now()}${Math.random().toString(36).slice(2, 5)}`, at: now(), by, ...log }, ...next.log].slice(0, 200) }
      : next
    stateRef.current = withLog
    setC(withLog)

    if (!adminRef.current || !readyRef.current) return Promise.resolve()
    const savePromise = new Promise<void>((resolve) => saveResolversRef.current.push(resolve))
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const { devAccounts: _devAccounts, devSession: _devSession, ...data } = stateRef.current
      const resolvers = saveResolversRef.current.splice(0)
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        const { error } = await supabase.from('dev_console_state').upsert({
          id: 1,
          data,
          updated_by: sessionRef.current?.user.id ?? null,
        })
        if (error) throw error
        setDataError(null)
      }).catch((reason: unknown) => {
        setDataError(reason instanceof Error ? reason.message : 'Unable to save developer-console data.')
      }).finally(() => resolvers.forEach((resolve) => resolve()))
    }, 250)
    return savePromise
  }, [])

  return (
    <C.Provider value={{ c, update, ready, dataError }}>
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
  const { c } = useConsole()
  const list = useMemo(
    () => c.banners.filter((b) => b.placement === placement && bannerActive(b) && (b.audience === 'all' || b.audience === viewer) && !(b.link.kind === 'place' && c.hiddenPlaces.includes(b.link.placeId))).sort((a, b) => a.priority - b.priority),
    [c.banners, c.hiddenPlaces, placement, viewer],
  )
  const bump = useCallback((id: string, key: 'views' | 'clicks') => {
    void supabase.rpc('track_dev_console_banner_event', { banner_id: id, event_type: key }).then(({ error }) => {
      if (error) console.error('Unable to track banner event', error)
    })
  }, [])
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
