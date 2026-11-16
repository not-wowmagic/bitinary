import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePersistentState } from "@/lib/usePersistentState"
import { supabase } from "@/lib/supabase"
import { clearBitinaryBrowserCache } from "@/lib/clearBitinaryBrowserCache"
import { authRedirectUrl } from "@/lib/authRedirectUrl"
import { AUTH_INTENT_KEY, AUTH_ROLE_KEY, resolveAuthRole } from "@/lib/authFlow"
import { updatePassword as applyPasswordUpdate } from "@/lib/passwordAuth"

export type Role = "traveler" | "business"
export type Method = "google" | "mobile" | "email"
export type Session = {
  kind: "user" | "guest"
  role: Role
  method?: Method
  accountId?: string
} | null
export type ThemeStatus = "done" | "skipped"

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
  locationPermission?: "while" | "deny"
}

export type TravelerThemeId = "trip" | "budget" | "food" | "interests" | "companions" | "needs" | "about" | "privacy"

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

export type BizThemeId = "basics" | "location" | "hours" | "contact" | "menu" | "photos" | "about" | "online" | "goals" | "verify"
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
export type Day = typeof DAYS[number]
export type DayHours = {
  open: string
  close: string
  closed: boolean
  allDay: boolean
}
export type MenuItem = {
  id: string
  name: string
  price: string
  category: string
}

export type BusinessProfile = {
  id?: string
  status: Partial<Record<BizThemeId, ThemeStatus>>
  name: string
  type?: string
  price?: string
  address: string
  city: string
  pin?: { lng: number; lat: number }
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
  verification: {
    method?: "upload" | "onsite"
    files: string[]
    onsiteDate?: string
    status: "none" | "pending" | "verified" | "needs-docs" | "rejected"
  }
  live: boolean
  liveAt?: string
}

/** Simulated account directory for the prototype (no backend). */
export type Account = {
  id: string
  name: string
  email?: string
  mobile?: string
  google?: string
  role: Role
}
const seedAccounts: Account[] = [
  {
    id: "acc-andrea",
    name: "Andrea Reyes",
    email: "andrea@example.ph",
    mobile: "9171234567",
    google: "andrea.reyes@gmail.com",
    role: "traveler",
  },
]

export const MAX_ATTEMPTS = 5
export const LOCK_MS = 5 * 60 * 1000

export const emptyPrefs: TravelerPrefs = {
  status: {},
  dailyBudget: 1500,
  mealBudget: 300,
  flexible: false,
  foods: [],
  diet: [],
  interests: [],
  companions: [],
  transport: [],
  needs: [],
}
export function skipAllTravelerPreferences(prefs: TravelerPrefs): TravelerPrefs {
  return {
    ...prefs,
    status: {
      ...prefs.status,
      trip: prefs.status.trip ?? "skipped",
      budget: prefs.status.budget ?? "skipped",
      food: prefs.status.food ?? "skipped",
      interests: prefs.status.interests ?? "skipped",
      companions: prefs.status.companions ?? "skipped",
      needs: prefs.status.needs ?? "skipped",
      about: prefs.status.about ?? "skipped",
      privacy: prefs.status.privacy ?? "skipped",
    },
  }
}
export const emptyProfile: Profile = { name: "", nickname: "" }
/** Privacy by default: promos off, photos private, location asked only when turned on. */
export const defaultConsent: Consent = {
  location: false,
  personalization: true,
  marketing: false,
  momentsShare: false,
}
const day = (): DayHours => ({
  open: "",
  close: "",
  closed: false,
  allDay: false,
})
export const emptyBusiness: BusinessProfile = {
  status: {},
  name: "",
  address: "",
  city: "",
  hours: {
    mon: day(),
    tue: day(),
    wed: day(),
    thu: day(),
    fri: day(),
    sat: day(),
    sun: day(),
  },
  contactName: "",
  mobile: "",
  landline: "",
  menu: [],
  photos: [],
  about: "",
  specialties: [],
  languages: [],
  links: { facebook: "", instagram: "", tiktok: "", website: "" },
  goals: [],
  verification: { files: [], status: "none" },
  live: false,
}

/** Where an unfinished sign-up should resume. */
export type Resume = { path: string; at: string } | null

type Ctx = {
  session: Session
  role: Role
  setRole: (r: Role) => void
  roleSelectionRequired: boolean
  setRoleSelectionRequired: (required: boolean) => void
  profile: Profile
  setProfile: (p: Profile | ((p: Profile) => Profile)) => void
  updateProfile: (next: Profile) => Promise<{ error: string | null }>
  updatePassword: (password: string, currentPassword?: string) => Promise<{ error: string | null }>
  consent: Consent
  setConsent: (c: Consent | ((c: Consent) => Consent)) => void
  prefs: TravelerPrefs
  setPrefs: (p: TravelerPrefs | ((p: TravelerPrefs) => TravelerPrefs)) => void
  business: BusinessProfile
  setBusiness: (
    b: BusinessProfile | ((b: BusinessProfile) => BusinessProfile),
  ) => void
  setupDone: boolean
  setSetupDone: (v: boolean) => void
  resume: Resume
  setResume: (r: Resume) => void
  hasAccount: boolean
  accounts: Account[]
  findAccount: (q: {
    email?: string
    mobile?: string
    google?: string
  }) => Account | undefined
  createAccount: (a: Omit<Account, "id">) => Account
  setAccountRole: (id: string, role: Role) => boolean
  deleteAccount: (id: string) => boolean
  isSeedAccount: (id: string) => boolean
  signIn: (a: Account, method: Method) => void
  signInWithGoogle: (
    mode?: "login" | "signup",
  ) => Promise<{ error: string | null }>
  continueAsGuest: () => void
  signOut: () => Promise<{ error: string | null; signedOut: boolean }>
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
export const normPH = (m?: string) =>
  m?.replace(/\D/g, "").replace(/^63/, "").replace(/^0/, "")

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = usePersistentState<Session>("session", null)
  const [profileAccountId, setProfileAccountId] = usePersistentState<string | null>(
    "profileAccountId",
    session?.accountId ?? null,
  )
  const [role, setRole] = usePersistentState<Role>("role", "traveler")
  const [roleSelectionRequired, setRoleSelectionRequired] = usePersistentState("roleSelectionRequired", false)
  const [profile, setProfile] = usePersistentState<Profile>(
    "profile2",
    emptyProfile,
  )
  const [consent, setConsent] = usePersistentState<Consent>(
    "consent2",
    defaultConsent,
  )
  const [prefs, setPrefs] = usePersistentState<TravelerPrefs>(
    "prefs2",
    emptyPrefs,
  )
  const [business, setBusiness] = usePersistentState<BusinessProfile>(
    "business2",
    emptyBusiness,
  )
  const [setupDone, setSetupDone] = usePersistentState("setupDone2", false)
  const [resume, setResume] = usePersistentState<Resume>("resume", null)
  const [hasAccount, setHasAccount] = usePersistentState("hasAccount", false)
  const [extraAccounts, setExtra] = usePersistentState<Account[]>(
    "accounts2",
    [],
  )
  const [attempts, setAttempts] = usePersistentState("authAttempts", 0)
  const [lockedUntil, setLockedUntil] = usePersistentState("authLockedUntil", 0)
  const [authPrompt, setAuthPrompt] = useState<string | null>(null)

  const accounts = useMemo(
    () => [...seedAccounts, ...extraAccounts],
    [extraAccounts],
  )

  const applyAuthUser = useCallback(
    (
      user: {
        id: string
        email?: string
        phone?: string
        user_metadata?: Record<string, unknown>
      } | null,
    ) => {
      if (!user) {
        setSession(null)
        return
      }
      const isAccountSwitch = profileAccountId !== user.id
      const nextRole = resolveAuthRole({
        metadataRole: user.user_metadata?.role,
        pendingRole: sessionStorage.getItem(AUTH_ROLE_KEY),
        intent: sessionStorage.getItem(AUTH_INTENT_KEY),
        isAccountSwitch,
        pathname: window.location.pathname,
        currentRole: role,
      })
      const name = String(
        user.user_metadata?.name ?? user.user_metadata?.full_name ?? "",
      )
      const isLoginCallback =
        (window.location.pathname.endsWith("/auth") ||
          window.location.pathname.endsWith("/auth/callback")) &&
        new URLSearchParams(window.location.search).get("mode") === "login"
      setRole(nextRole)
      setSession({
        kind: "user",
        role: nextRole,
        method: user.phone ? "mobile" : "email",
        accountId: user.id,
      })
      setProfileAccountId(user.id)
      setHasAccount(true)
      if (isAccountSwitch) setPrefs(emptyPrefs)
      if (isLoginCallback) {
        setSetupDone(true)
        setResume(null)
      }
      setProfile((p) =>
        isAccountSwitch
          ? {
              name,
              nickname: name.split(" ")[0] ?? "",
              email: user.email,
              mobile: user.phone,
            }
          : {
              ...p,
              name: p.name || name,
              nickname: p.nickname || name.split(" ")[0],
              email: user.email || p.email,
              mobile: user.phone || p.mobile,
            },
      )
    },
    [
      role,
      setHasAccount,
      profileAccountId,
      setPrefs,
      setProfile,
      setProfileAccountId,
      setRole,
      setSession,
      setSetupDone,
      setResume,
    ],
  )

  useEffect(() => {
    let active = true
    const normalizeOAuthCallback = (
      user: { user_metadata?: Record<string, unknown> } | null,
    ) => {
      if (!user || !window.location.hash.includes("access_token")) return
      if (
        window.location.pathname.endsWith("/auth/recovery") ||
        window.location.pathname.endsWith("/biz/auth/recovery")
      ) {
        sessionStorage.setItem("bitinary:password-recovery", "true")
        return
      }
      if (
        window.location.pathname.endsWith("/auth") ||
        window.location.pathname.endsWith("/biz/auth") ||
        window.location.pathname.endsWith("/auth/callback")
      ) {
        window.history.replaceState(
          null,
          document.title,
          `${window.location.pathname}${window.location.search}`,
        )
        return
      }
      const isBusiness = user.user_metadata?.role === "business"
      const target = isBusiness ? "biz/auth?mode=login" : "auth?mode=login"
      window.location.replace(
        `${window.location.origin}${import.meta.env.BASE_URL}${target}`,
      )
    }
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        normalizeOAuthCallback(data.session?.user ?? null)
        applyAuthUser(data.session?.user ?? null)
      }
    })
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("bitinary:password-recovery", "true")
      }
      if (active) {
        if (event === "SIGNED_OUT") {
          setRole("traveler")
          setRoleSelectionRequired(true)
          setSetupDone(false)
          setResume(null)
          sessionStorage.removeItem(AUTH_INTENT_KEY)
          sessionStorage.removeItem(AUTH_ROLE_KEY)
          sessionStorage.removeItem("bitinary:password-recovery")
        }
        normalizeOAuthCallback(nextSession?.user ?? null)
        applyAuthUser(nextSession?.user ?? null)
      }
    })
    if (window.location.hash.includes("access_token")) {
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
          (q.google &&
            (a.google?.toLowerCase() === q.google.toLowerCase() ||
              a.email?.toLowerCase() === q.google.toLowerCase())),
      ),
    [accounts],
  )

  const createAccount = useCallback(
    (a: Omit<Account, "id">) => {
      const acc = { ...a, id: `acc-${Date.now()}` }
      setExtra((x) => [...x, acc])
      return acc
    },
    [setExtra],
  )

  const isSeedAccount = useCallback(
    (id: string) => seedAccounts.some((account) => account.id === id),
    [],
  )

  const setAccountRole = useCallback(
    (id: string, nextRole: Role) => {
      if (isSeedAccount(id) || !extraAccounts.some((account) => account.id === id)) return false
      setExtra((items) => items.map((account) => account.id === id ? { ...account, role: nextRole } : account))
      if (session?.accountId === id) setRole(nextRole)
      return true
    },
    [extraAccounts, isSeedAccount, session?.accountId, setExtra, setRole],
  )

  const deleteAccount = useCallback(
    (id: string) => {
      if (isSeedAccount(id) || !extraAccounts.some((account) => account.id === id)) return false
      setExtra((items) => items.filter((account) => account.id !== id))
      if (session?.accountId === id) setSession(null)
      return true
    },
    [extraAccounts, isSeedAccount, session?.accountId, setExtra, setSession],
  )

  const signIn = useCallback(
    (a: Account, method: Method) => {
      const isAccountSwitch = profileAccountId !== a.id
      setSession({ kind: "user", role: a.role, method, accountId: a.id })
      setProfileAccountId(a.id)
      setRole(a.role)
      setHasAccount(true)
      if (isAccountSwitch) setPrefs(emptyPrefs)
      setProfile((p) =>
        isAccountSwitch
          ? {
              name: a.name,
              nickname: a.name.split(" ")[0] ?? "",
              email: a.email || a.google,
              mobile: a.mobile,
            }
          : {
              ...p,
              name: p.name || a.name,
              nickname: p.nickname || a.name.split(" ")[0],
              email: a.email || a.google || p.email,
              mobile: a.mobile || p.mobile,
            },
      )
    },
    [profileAccountId, setSession, setProfileAccountId, setRole, setHasAccount, setPrefs, setProfile],
  )

  const signInWithGoogle = useCallback(
    async (mode: "login" | "signup" = "login") => {
      sessionStorage.setItem(AUTH_INTENT_KEY, mode)
      if (mode === "signup") sessionStorage.setItem(AUTH_ROLE_KEY, role)
      else sessionStorage.removeItem(AUTH_ROLE_KEY)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authRedirectUrl("auth", { mode }),
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      })
      if (error) {
        sessionStorage.removeItem(AUTH_INTENT_KEY)
        sessionStorage.removeItem(AUTH_ROLE_KEY)
      }
      return { error: error?.message ?? null }
    },
    [role],
  )

  const continueAsGuest = useCallback(
    () => setSession({ kind: "guest", role: "traveler" }),
    [setSession],
  )
  const signOut = useCallback(async () => {
    if (session?.kind === "user") {
      const { error } = await supabase.auth.signOut()
      if (error) return { error: error.message, signedOut: false }
    }

    setSession(null)
    setRole("traveler")
    setRoleSelectionRequired(true)
    setSetupDone(false)
    setResume(null)
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    try {
      await clearBitinaryBrowserCache()
      return { error: null, signedOut: true }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Browser cache could not be cleared."
      return {
        error: `Signed out, but Bitinary cache could not be cleared: ${message}`,
        signedOut: true,
      }
    }
  }, [session?.kind, setSession, setRole, setRoleSelectionRequired, setSetupDone, setResume])
  const updateProfile = useCallback(
    async (next: Profile) => {
      setProfile(next)
      if (session?.kind !== "user" || !session.accountId)
        return {
          error:
            "Na-save lang sa device. Mag-sign in para ma-sync sa database.",
        }
      const { error } = await supabase.from("profiles").upsert({
        id: session.accountId,
        role,
        name: next.name,
        nickname: next.nickname,
        avatar_url: next.avatar ?? null,
        age_range: next.ageRange ?? null,
        city: next.city ?? null,
        mobile: next.mobile ?? null,
      })
      if (error) return { error: error.message }
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: next.name,
          full_name: next.name,
          nickname: next.nickname,
        },
      })
      if (authError) return { error: authError.message }
      return { error: null }
    },
    [role, session, setProfile],
  )
  const updatePassword = useCallback(async (password: string, currentPassword?: string) => {
    return applyPasswordUpdate(password, currentPassword)
  }, [])
  const resetEverything = useCallback(() => {
    setSession(null)
    setProfile(emptyProfile)
    setProfileAccountId(null)
    setPrefs(emptyPrefs)
    setConsent(defaultConsent)
    setBusiness(emptyBusiness)
    setSetupDone(false)
    setResume(null)
    setHasAccount(false)
    setExtra([])
    setAttempts(0)
    setLockedUntil(0)
  }, [
    setSession,
    setProfile,
    setProfileAccountId,
    setPrefs,
    setConsent,
    setBusiness,
    setSetupDone,
    setResume,
    setHasAccount,
    setExtra,
    setAttempts,
    setLockedUntil,
  ])

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
      if (session?.kind === "user") return true
      setAuthPrompt(reason)
      return false
    },
    [session],
  )

  const value: Ctx = {
    session,
    role,
    setRole,
    roleSelectionRequired,
    setRoleSelectionRequired,
    profile,
    setProfile,
    updateProfile,
    updatePassword,
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
    setAccountRole,
    deleteAccount,
    isSeedAccount,
    signIn,
    signInWithGoogle,
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
  const c = useOptionalAccount()
  if (!c) throw new Error("useAccount outside AccountProvider")
  return c
}

export function useOptionalAccount() {
  return useContext(C)
}

/** Friendly first name for greetings. */
export function useGreetingName() {
  const { profile, session } = useAccount()
  if (session?.kind === "guest") return "Biyahero"
  return profile.nickname || profile.name.split(" ")[0] || "Biyahero"
}
