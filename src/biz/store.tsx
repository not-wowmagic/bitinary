import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { emptyBusiness, type BusinessProfile } from '@/app/account'
import { LangOverride, type Lang } from '@/app/i18n'
import type { Expression } from '@/components/mascot/Jimbot'
import { getForcedState, isEmbed } from '@/lib/forced'
import { usePersistentState } from '@/lib/usePersistentState'
import {
  demoBusiness, seedBoosts, seedBranches, seedCases, seedComments, seedDeals, seedNotifs, seedPosts, seedRequests, seedReviews, seedStaff, ago,
  type Boost, type Branch, type Case, type Comment, type Deal, type Notif, type Post, type ResRequest, type Review, type Staff,
} from './seed'

export type LangPref = 'en' | 'tl' | 'device'
export type Channel = 'notif' | 'messenger' | 'sms'

export type BizData = {
  langPref: LangPref | null
  session: { method: 'google' | 'mobile' | 'email'; contact: string } | null
  resume: string | null
  profile: { name: string; nickname: string; email: string; mobile: string; google?: string }
  business: BusinessProfile
  updated: Record<string, string>
  quick: { state: 'open' | 'closed'; soldOut: boolean; longQueue: boolean; special: string; at?: string }
  branches: Branch[]
  activeBranch: string
  staff: Staff[]
  posts: Post[]
  comments: Comment[]
  reviews: Review[]
  cases: Case[]
  deals: Deal[]
  boosts: Boost[]
  requests: ResRequest[]
  reservations: { enabled: boolean; tables: number; maxParty: number; slot: number }
  queue: { open: boolean; waiting: number }
  notifs: Notif[]
  prefs: { jimbotMatch: boolean; channel: Channel; notif: { reviews: boolean; comments: boolean; reports: boolean; weekly: boolean; deals: boolean } }
  qrToken: string
  blocked: string[]
  reportsUsed: number
}

const updatedSeed = { basics: ago(40 * 864e5), location: ago(40 * 864e5), hours: ago(9 * 864e5), contact: ago(40 * 864e5), menu: ago(3 * 864e5), photos: ago(12 * 864e5), about: ago(30 * 864e5), online: ago(30 * 864e5), verify: ago(2 * 864e5) }

/** Activity (posts, reviews, stats) is seeded so the prototype always has something to manage. */
export const initialData: BizData = {
  langPref: null,
  session: null,
  resume: null,
  profile: { name: '', nickname: '', email: '', mobile: '' },
  business: emptyBusiness,
  updated: {},
  quick: { state: 'open', soldOut: false, longQueue: false, special: '' },
  branches: [],
  activeBranch: '',
  staff: [],
  posts: [],
  comments: [],
  reviews: [],
  cases: [],
  deals: [],
  boosts: [],
  requests: [],
  reservations: { enabled: false, tables: 0, maxParty: 0, slot: 0 },
  queue: { open: false, waiting: 0 },
  notifs: [],
  prefs: { jimbotMatch: false, channel: 'notif', notif: { reviews: true, comments: true, reports: true, weekly: true, deals: true } },
  qrToken: '',
  blocked: [],
  reportsUsed: 0,
}

export const demoData: BizData = {
  ...initialData,
  langPref: 'en',
  session: { method: 'email', contact: 'ben@kainanmangben.ph' },
  profile: { name: 'Ben Dizon', nickname: 'Ben', email: 'ben@kainanmangben.ph', mobile: '9171234500', google: 'ben.dizon@gmail.com' },
  business: demoBusiness,
  updated: updatedSeed,
  branches: seedBranches,
  activeBranch: 'br1',
  staff: seedStaff,
  posts: seedPosts,
  comments: seedComments,
  reviews: seedReviews,
  cases: seedCases,
  deals: seedDeals,
  boosts: seedBoosts,
  requests: seedRequests,
  reservations: { enabled: true, tables: 12, maxParty: 12, slot: 90 },
  queue: { open: true, waiting: 4 },
  notifs: seedNotifs,
  qrToken: 'KMB-7F3A',
  reportsUsed: 2,
  quick: { state: 'open', soldOut: false, longQueue: false, special: 'Sinigang na hipon' },
}

export const REPORT_LIMIT = 5
export type BizStatus = 'draft' | 'live' | 'pending' | 'needs-docs' | 'verified'

type Toast = { id: number; text: string; expression?: Expression; action?: { label: string; to: string }; undo?: () => void }
type Ctx = {
  d: BizData
  set: (fn: (d: BizData) => BizData) => void
  lang: Lang
  t: (tl: string, en: string) => string
  setLangPref: (l: LangPref) => void
  status: BizStatus
  verified: boolean
  toast: Toast | null
  showToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: () => void
  loadDemo: () => void
  reset: () => void
}
const C = createContext<Ctx | null>(null)

const deviceLang = (): Lang => (/^(tl|fil)/i.test(navigator.language) ? 'tl' : 'en')
const queryLang = (): Lang | null => {
  const l = new URLSearchParams(location.search).get('lang')
  return l === 'tl' || l === 'en' ? l : null
}

export function statusOf(b: BusinessProfile): BizStatus {
  if (!b.live) return 'draft'
  const v = b.verification.status
  return v === 'verified' ? 'verified' : v === 'pending' ? 'pending' : v === 'needs-docs' ? 'needs-docs' : 'live'
}

export function BizProvider({ children }: { children: ReactNode }) {
  const [data, setData] = usePersistentState<BizData>('biz', initialData)
  const [toast, setToast] = useState<Toast | null>(null)
  const forced = getForcedState()
  // Screen Index frames (embed) without a session show the demo business and keep edits in memory only.
  const [demo, setDemo] = useState<BizData>(() => ({ ...demoData, langPref: data.langPref ?? 'en' }))
  const sandbox = isEmbed() && !data.session
  const base = sandbox ? demo : data

  const view = useMemo<BizData>(() => {
    let v = base
    const b = v.business
    const ver = (s: BusinessProfile['verification']['status']) => ({ ...v, business: { ...b, live: true, verification: { ...b.verification, status: s } } })
    if (forced === 'verified') v = ver('verified')
    if (forced === 'unverified') v = ver('none')
    if (forced === 'needs-docs') v = ver('needs-docs')
    if (forced === 'pending') v = ver('pending')
    if (forced === 'fresh') v = { ...v, business: emptyBusiness, updated: {} }
    if (forced === 'setup-ready') v = { ...v, business: { ...b, live: false, verification: { ...b.verification, status: 'none' }, status: { basics: 'done', location: 'done', hours: 'done', contact: 'done', menu: 'done' } } }
    if (forced === 'draft') v = { ...v, business: { ...b, live: false, verification: { ...b.verification, status: 'none' }, status: { basics: 'done', location: 'done' } } }
    return v
  }, [base, forced])

  const lang: Lang = queryLang() ?? (data.langPref === 'device' ? deviceLang() : data.langPref ?? 'en')
  const t = useCallback((tl: string, en: string) => (lang === 'en' ? en : tl), [lang])
  const set = useCallback((fn: (d: BizData) => BizData) => (sandbox ? setDemo(fn) : setData(fn)), [sandbox, setData])
  const showToast = useCallback((x: Omit<Toast, 'id'>) => setToast({ ...x, id: Date.now() }), [])
  const status = statusOf(view.business)

  const value: Ctx = {
    d: view,
    set,
    lang,
    t,
    setLangPref: (l) => setData((d) => ({ ...d, langPref: l })),
    status,
    verified: status === 'verified',
    toast,
    showToast,
    dismissToast: () => setToast(null),
    loadDemo: () => setData((d) => ({ ...demoData, langPref: d.langPref ?? 'en' })),
    reset: () => setData((d) => ({ ...initialData, langPref: d.langPref })),
  }
  return (
    <C.Provider value={value}>
      <LangOverride lang={lang} setLang={(l) => setData((d) => ({ ...d, langPref: l }))} chosen={!!data.langPref}>
        {children}
      </LangOverride>
    </C.Provider>
  )
}

export function useBiz() {
  const c = useContext(C)
  if (!c) throw new Error('useBiz outside BizProvider')
  return c
}

/** Shorthand for patching the business profile. */
export function useBusiness() {
  const { d, set } = useBiz()
  const setBusiness = useCallback((b: BusinessProfile | ((b: BusinessProfile) => BusinessProfile)) => set((x) => ({ ...x, business: typeof b === 'function' ? b(x.business) : b })), [set])
  return [d.business, setBusiness] as const
}
