import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { emptyBusiness, type BusinessProfile } from '@/app/account'
import { LangOverride, type Lang } from '@/app/i18n'
import type { Expression } from '@/components/mascot/Jimbot'
import { getForcedState } from '@/lib/forced'
import { AUTH_INTENT_KEY, AUTH_ROLE_KEY } from '@/lib/authFlow'
import { supabase } from '@/lib/supabase'
import { usePersistentState } from '@/lib/usePersistentState'
import { clearBitinaryBrowserCache } from '@/lib/clearBitinaryBrowserCache'
import { loadOwnedWorkspace } from './db/loadWorkspace'
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

function persistedWorkspace(data: BizData) {
  const { langPref: _langPref, session: _session, resume: _resume, profile: _profile, ...workspace } = data
  return workspace
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
  loading: boolean
  loadError: string | null
  retryLoad: () => void
  signOut: () => Promise<{ error: string | null }>
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
  return v === 'verified' ? 'verified' : v === 'pending' ? 'pending' : v === 'needs-docs' || v === 'rejected' ? 'needs-docs' : 'live'
}

export function BizProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BizData>(initialData)
  const [storedLang, setStoredLang] = usePersistentState<LangPref | null>('biz-lang', null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const dataRef = useRef(data)
  const storedLangRef = useRef(storedLang)
  storedLangRef.current = storedLang
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const [loadVersion, setLoadVersion] = useState(0)
  const forced = getForcedState()

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    void supabase.auth.getSession().then(async ({ data: sessionData, error: sessionError }) => {
      if (sessionError) throw sessionError
      if (!sessionData.session) return { ...initialData, langPref: storedLangRef.current }
      const result = await loadOwnedWorkspace()
      if (result.error) throw new Error(result.error)
      const user = sessionData.session.user
      const businessUser =
        user.user_metadata?.role === 'business' ||
        (sessionStorage.getItem(AUTH_INTENT_KEY) === 'signup' &&
          sessionStorage.getItem(AUTH_ROLE_KEY) === 'business')
      const session = result.data || businessUser
        ? { method: user.phone ? 'mobile' as const : 'email' as const, contact: user.email ?? user.phone ?? '' }
        : null
      const workspace = result.data ?? initialData
      return {
        ...workspace,
        langPref: storedLangRef.current,
        session,
        profile: {
          ...workspace.profile,
          name: workspace.profile.name || String(user.user_metadata?.name ?? user.user_metadata?.full_name ?? ''),
          email: workspace.profile.email || user.email || '',
          mobile: workspace.profile.mobile || user.phone || '',
        },
      }
    }).then((workspace) => {
      if (!active) return
      dataRef.current = workspace
      setData(workspace)
      setLoading(false)
    }).catch((error: unknown) => {
      if (!active) return
      setLoadError(error instanceof Error ? error.message : 'Business data could not be loaded.')
      setLoading(false)
    })
    return () => { active = false }
  }, [loadVersion])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const next = { ...initialData, langPref: storedLangRef.current }
        dataRef.current = next
        setData(next)
        setLoadError(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setLoadVersion((version) => version + 1)
      }
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  const view = useMemo<BizData>(() => {
    let v = data
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
  }, [data, forced])

  const lang: Lang = queryLang() ?? (data.langPref === 'device' ? deviceLang() : data.langPref ?? 'en')
  const t = useCallback((tl: string, en: string) => (lang === 'en' ? en : tl), [lang])
  const set = useCallback((fn: (d: BizData) => BizData) => {
    saveQueue.current = saveQueue.current.then(async () => {
      const previous = dataRef.current
      const next = fn(previous)
      const payload = persistedWorkspace(next)
      if (JSON.stringify(persistedWorkspace(previous)) === JSON.stringify(payload)) {
        dataRef.current = next
        setData(next)
        return
      }
      const { error } = await supabase.rpc('save_business_workspace', { p_workspace: payload })
      if (error) throw new Error(error.message)
      dataRef.current = next
      setData(next)
    }).catch((error: unknown) => {
      setToast({ id: Date.now(), text: error instanceof Error ? error.message : 'Business changes could not be saved.' })
    })
  }, [])
  const showToast = useCallback((x: Omit<Toast, 'id'>) => setToast({ ...x, id: Date.now() }), [])
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      showToast({ text: error.message })
      return { error: error.message }
    }
    const next = { ...initialData, langPref: storedLangRef.current }
    dataRef.current = next
    setData(next)
    try {
      await clearBitinaryBrowserCache()
    } catch (cacheError: unknown) {
      const message = cacheError instanceof Error ? cacheError.message : 'Browser cache could not be cleared.'
      showToast({ text: `Signed out, but Bitinary cache could not be cleared: ${message}` })
      return { error: message }
    }
    return { error: null }
  }, [showToast])
  const status = statusOf(view.business)

  const value: Ctx = {
    d: view,
    set,
    lang,
    t,
    setLangPref: (l) => {
      setStoredLang(l)
      dataRef.current = { ...dataRef.current, langPref: l }
      setData(dataRef.current)
    },
    status,
    verified: status === 'verified',
    toast,
    showToast,
    dismissToast: () => setToast(null),
    loading,
    loadError,
    retryLoad: () => setLoadVersion((version) => version + 1),
    signOut,
    loadDemo: () => showToast({ text: 'Demo data is disabled for database-backed business accounts.' }),
    reset: () => showToast({ text: 'Business data cannot be reset from this screen.' }),
  }
  return (
    <C.Provider value={value}>
      <LangOverride lang={lang} setLang={(l) => {
        setStoredLang(l)
        dataRef.current = { ...dataRef.current, langPref: l }
        setData(dataRef.current)
      }} chosen={!!data.langPref}>
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
