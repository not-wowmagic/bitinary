import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePersistentState } from '@/lib/usePersistentState'
import { supabase } from '@/lib/supabase'

export type Role = 'traveler' | 'business'
export type Method = 'google' | 'mobile' | 'email'
export type Session = { kind: 'user' | 'guest'; role: Role; method?: Method; accountId?: string } | null
export type ThemeStatus = 'done' | 'skipped'

export type Profile = {
  name: string
  nickname: string
  avatar?: string
  ageRange?: string
  city?: string
  mobile?: string
  email?: string
}

export type Consent = {
  location: boolean
  personalization: boolean
  marketing: boolean
  momentsShare: boolean
  locationPermission?: 'while' | 'deny'
}

export type TravelerThemeId = 'trip' | 'budget' | 'food' | 'interests' | 'companions' | 'needs' | 'about' | 'privacy'

export type TravelerPrefs = {
  status: Partial<Record<TravelerThemeId, ThemeStatus>>
  lastTrip?: string
  /** when the "last trip" answer was given (ISO), used for relative labels and freshness */
  lastTripAt?: string
  /** set when the user confirms the last-trip answer is still right */
  tripCheckedAt?: string
  frequency?: string
  nextTrip?: string
  dailyBudget: number
  mealBudget: number
  flexible: boolean
  foods: string[]
  diet: string[]
  allergy?: string
  interests: string[]
  companions: string[]
  transport: string[]
  pace?: string
  needs: string[]
}

export type BizThemeId = 'basics' | 'location' | 'hours' | 'contact' | 'menu' | 'photos' | 'about' | 'online' | 'goals' | 'verify'
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Day = (typeof DAYS)[number]
export type DayHours = { open: string; close: string; closed: boolean; allDay: boolean }
export type MenuItem = { id: string; name: string; price: string; category: string }

export type BusinessProfile = {
  status: Partial<Record<BizThemeId, ThemeStatus>>
  name: string
  type?: string
  price?: string
  address: string
  city: string
  pin?: { x: number; y: number }
  hours: Record<Day, DayHours>
  contactName: string
  mobile: string
  landline: string
  menu: MenuItem[]
  cover?: string
  photos: string[]
  about: string
  specialties: string[]
  languages: string[]
  links: { facebook: string; instagram: string; tiktok: string; website: string }
  goals: string[]
  verification: { method?: 'upload' | 'onsite'; files: string[]; onsiteDate?: string; status: 'none' | 'pending' | 'verified' | 'needs-docs' }
  live: boolean
  liveAt?: string
}

/** Simulated account directory for the prototype (no backend). */
export type Account = { id: string; name: string; email?: string; mobile?: string; google?: string; role: Role }
const seedAccounts: Account[] = [{ id: 'acc-andrea', name: 'Andrea Reyes', email: 'andrea@example.ph', mobile: '9171234567', google: 'andrea.reyes@gmail.com', role: 'traveler' }]

export const MAX_ATTEMPTS = 5
export const LOCK_MS = 5 * 60 * 1000

export const emptyPrefs: TravelerPrefs = { status: {}, dailyBudget: 1500, mealBudget: 300, flexible: false, foods: [], diet: [], interests: [], companions: [], transport: [], needs: [] }
export const emptyProfile: Profile = { name: '', nickname: '' }
/** Privacy by default: promos off, photos private, location asked only when turned on. */
export const defaultConsent: Consent = { location: false, personalization: true, marketing: false, momentsShare: false }
const day = (open = '08:00', close = '20:00', closed = false): DayHours => ({ open, close, closed, allDay: false })
export const emptyBusiness: BusinessProfile = {
  status: {},
  name: '',
  address: '',
  city: '',
  hours: { mon: day(), tue: day(), wed: day(), thu: day(), fri: day(), sat: day(), sun: day('08:00', '20:00', true) },
  contactName: '',
  mobile: '',
  landline: '',
  menu: [],
  photos: [],
  about: '',
  specialties: [],
  languages: ['Tagalog'],
  links: { facebook: '', instagram: '', tiktok: '', website: '' },
  goals: [],
  verification: { files: [], status: 'none' },
  live: false,
}

/** Where an unfinished sign-up should resume. */
export type Resume = { path: string; at: string } | null

type Ctx = {
  session: Session
  role: Role
  setRole: (r: Role) => void
  profile: Profile
  setProfile: (p: Profile | ((p: Profile) => Profile)) => void
  consent: Consent
  setConsent: (c: Consent | ((c: Consent) => Consent)) => void
  prefs: TravelerPrefs
  setPrefs: (p: TravelerPrefs | ((p: TravelerPrefs) => TravelerPrefs)) => void
  business: BusinessProfile
  setBusiness: (b: BusinessProfile | ((b: BusinessProfile) => BusinessProfile)) => void
  setupDone: boolean
  setSetupDone: (v: boolean) => void
  resume: Resume
  setResume: (r: Resume) => void
  hasAccount: boolean
  accounts: Account[]
  findAccount: (q: { email?: string; mobile?: string; google?: string }) => Account | undefined
  createAccount: (a: Omit<Account, 'id'>) => Account
  signIn: (a: Account, method: Method) => void
  signInWithGoogle: (mode?: 'login' | 'signup') => Promise<{ error: string | null }>
  sendOtp: (contact: { email?: string; phone?: string }, shouldCreateUser: boolean, captchaToken?: string) => Promise<{ error: string | null }>
  verifyOtp: (contact: { email?: string; phone?: string }, token: string) => Promise<{ error: string | null }>
  continueAsGuest: () => void
  signOut: () => void
  resetEverything: () => void
  attempts: number
  registerFailure: () => number
  clearFailures: () => void
  lockedUntil: number
  authPrompt: string | null
  requireAccount: (reason: string) => boolean
  closeAuthPrompt: () => void
}

const C = createContext<Ctx | null>(null)
export const normPH = (m?: string) => m?.replace(/\D/g, '').replace(/^63/, '').replace(/^0/, '')

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = usePersistentState<Session>('session', null)
  const [role, setRole] = usePersistentState<Role>('role', 'traveler')
  const [profile, setProfile] = usePersistentState<Profile>('profile2', emptyProfile)
  const [consent, setConsent] = usePersistentState<Consent>('consent2', defaultConsent)
  const [prefs, setPrefs] = usePersistentState<TravelerPrefs>('prefs2', emptyPrefs)
  const [business, setBusiness] = usePersistentState<BusinessProfile>('business2', emptyBusiness)
  const [setupDone, setSetupDone] = usePersistentState('setupDone2', false)
  const [resume, setResume] = usePersistentState<Resume>('resume', null)
  const [hasAccount, setHasAccount] = usePersistentState('hasAccount', false)
  const [extraAccounts, setExtra] = usePersistentState<Account[]>('accounts2', [])
  const [attempts, setAttempts] = usePersistentState('authAttempts', 0)
  const [lockedUntil, setLockedUntil] = usePersistentState('authLockedUntil', 0)
  const [authPrompt, setAuthPrompt] = useState<string | null>(null)

  const accounts = useMemo(() => [...seedAccounts, ...extraAccounts], [extraAccounts])

  const applyAuthUser = useCallback(
    (user: { id: string; email?: string; phone?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) {
        setSession(null)
        return
      }
      const metadataRole = user.user_metadata?.role
      const nextRole: Role = metadataRole === 'business' ? 'business' : role
      const name = String(user.user_metadata?.name ?? user.user_metadata?.full_name ?? '')
      const isLoginCallback = window.location.pathname.endsWith('/auth') && new URLSearchParams(window.location.search).get('mode') === 'login'
      setRole(nextRole)
      setSession({ kind: 'user', role: nextRole, method: user.phone ? 'mobile' : 'email', accountId: user.id })
      setHasAccount(true)
      if (isLoginCallback) {
        setSetupDone(true)
        setResume(null)
      }
      setProfile((p) => ({
        ...p,
        name: p.name || name,
        nickname: p.nickname || name.split(' ')[0],
        email: p.email || user.email,
        mobile: p.mobile || user.phone,
      }))
    },
    [role, setHasAccount, setProfile, setRole, setSession, setSetupDone, setResume],
  )

  useEffect(() => {
    let active = true
    const normalizeOAuthCallback = (user: { user_metadata?: Record<string, unknown> } | null) => {
      if (!user || !window.location.hash.includes('access_token')) return
      if (window.location.pathname.endsWith('/auth') || window.location.pathname.endsWith('/biz/auth')) {
        window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`)
        return
      }
      const isBusiness = user.user_metadata?.role === 'business'
      const target = isBusiness ? 'biz/auth?mode=login' : 'auth?mode=login'
      window.location.replace(`${window.location.origin}${import.meta.env.BASE_URL}${target}`)
    }
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        normalizeOAuthCallback(data.session?.user ?? null)
        applyAuthUser(data.session?.user ?? null)
      }
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        normalizeOAuthCallback(nextSession?.user ?? null)
        applyAuthUser(nextSession?.user ?? null)
      }
    })
    if (window.location.hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: sessionData }) => {
        if (active) normalizeOAuthCallback(sessionData.session?.user ?? null)
      })
    }
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [applyAuthUser])

  const findAccount = useCallback(
    (q: { email?: string; mobile?: string; google?: string }) =>
      accounts.find(
        (a) =>
          (q.email && a.email?.toLowerCase() === q.email.toLowerCase()) ||
          (q.mobile && normPH(a.mobile) === normPH(q.mobile)) ||
          (q.google && (a.google?.toLowerCase() === q.google.toLowerCase() || a.email?.toLowerCase() === q.google.toLowerCase())),
      ),
    [accounts],
  )

  const createAccount = useCallback(
    (a: Omit<Account, 'id'>) => {
      const acc = { ...a, id: `acc-${Date.now()}` }
      setExtra((x) => [...x, acc])
      return acc
    },
    [setExtra],
  )

  const signIn = useCallback(
    (a: Account, method: Method) => {
      setSession({ kind: 'user', role: a.role, method, accountId: a.id })
      setRole(a.role)
      setHasAccount(true)
      setProfile((p) => ({
        ...p,
        name: p.name || a.name,
        nickname: p.nickname || a.name.split(' ')[0],
        email: p.email || a.email || a.google,
        mobile: p.mobile || a.mobile,
      }))
    },
    [setSession, setRole, setHasAccount, setProfile],
  )

  const signInWithGoogle = useCallback(async (mode: 'login' | 'signup' = 'login') => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
    sessionStorage.setItem('bitinary:auth-intent', mode)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl.replace(/\/$/, '')}${import.meta.env.BASE_URL}auth?mode=${mode}`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    })
    return { error: error?.message ?? null }
  }, [role])

  const sendOtp = useCallback(async (contact: { email?: string; phone?: string }, shouldCreateUser: boolean, captchaToken?: string) => {
    const options = { shouldCreateUser, data: { role }, ...(captchaToken ? { captchaToken } : {}) }
    const { error } = contact.email
      ? await supabase.auth.signInWithOtp({ email: contact.email, options })
      : await supabase.auth.signInWithOtp({ phone: contact.phone!, options })
    return { error: error?.message ?? null }
  }, [role])

  const verifyOtp = useCallback(async (contact: { email?: string; phone?: string }, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: contact.email,
      phone: contact.phone,
      token,
      type: contact.phone ? 'sms' : 'email',
    })
    if (!error) applyAuthUser(data.user)
    return { error: error?.message ?? null }
  }, [applyAuthUser])

  const continueAsGuest = useCallback(() => setSession({ kind: 'guest', role: 'traveler' }), [setSession])
  const signOut = useCallback(() => setSession(null), [setSession])
  const resetEverything = useCallback(() => {
    setSession(null)
    setProfile(emptyProfile)
    setPrefs(emptyPrefs)
    setConsent(defaultConsent)
    setBusiness(emptyBusiness)
    setSetupDone(false)
    setResume(null)
    setHasAccount(false)
    setExtra([])
    setAttempts(0)
    setLockedUntil(0)
  }, [setSession, setProfile, setPrefs, setConsent, setBusiness, setSetupDone, setResume, setHasAccount, setExtra, setAttempts, setLockedUntil])

  const registerFailure = useCallback(() => {
    const n = attempts + 1
    setAttempts(n)
    if (n >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_MS)
      setAttempts(0)
    }
    return n
  }, [attempts, setAttempts, setLockedUntil])
  const clearFailures = useCallback(() => {
    setAttempts(0)
    setLockedUntil(0)
  }, [setAttempts, setLockedUntil])

  const requireAccount = useCallback(
    (reason: string) => {
      if (session?.kind === 'user') return true
      setAuthPrompt(reason)
      return false
    },
    [session],
  )

  const value: Ctx = {
    session,
    role,
    setRole,
    profile,
    setProfile,
    consent,
    setConsent,
    prefs,
    setPrefs,
    business,
    setBusiness,
    setupDone,
    setSetupDone,
    resume,
    setResume,
    hasAccount,
    accounts,
    findAccount,
    createAccount,
    signIn,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    continueAsGuest,
    signOut,
    resetEverything,
    attempts,
    registerFailure,
    clearFailures,
    lockedUntil,
    authPrompt,
    requireAccount,
    closeAuthPrompt: () => setAuthPrompt(null),
  }
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useAccount() {
  const c = useContext(C)
  if (!c) throw new Error('useAccount outside AccountProvider')
  return c
}

/** Friendly first name for greetings. */
export function useGreetingName() {
  const { profile, session } = useAccount()
  if (session?.kind === 'guest') return 'Biyahero'
  return profile.nickname || profile.name.split(' ')[0] || 'Biyahero'
}
