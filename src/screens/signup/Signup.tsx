import {
  AtSign,
  ChevronRight,
  Lock,
  Mail,
  Store,
  Utensils,
  WifiOff,
} from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import {
  skipAllTravelerPreferences,
  useAccount,
  type Role,
} from "@/app/account"
import { useLang, useT } from "@/app/i18n"
import { useStore } from "@/app/store"
import { TermsConsentCard } from "@/components/auth/TermsConsentCard"
import { FlowLayout } from "@/components/flow/FlowLayout"
import { GoogleLogo, PasswordField, SelectCard, StrengthMeter, TextField } from "@/components/flow/Fields"
import { Jimbot } from "@/components/mascot/Jimbot"
import { SavedNote, StepHeader } from "@/components/onboarding/Kit"
import { SuccessScreen } from "@/components/onboarding/Templates"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Segmented"
import { cn } from "@/lib/cn"
import { getForcedState, isEmbed } from "@/lib/forced"
import { mmss, useCountdown } from "@/lib/useCountdown"
import { useOnline } from "@/lib/useOnline"
import { supabase } from "@/lib/supabase"
import { authLandingPath, AUTH_INTENT_KEY, AUTH_ROLE_KEY } from "@/lib/authFlow"
import { resendSignupConfirmation, signInWithEmailPassword, signUpWithEmailPassword } from "@/lib/passwordAuth"
import { turnstileSiteKey } from "@/lib/turnstile"
import { PasswordRecoveryPage } from "@/screens/signup/PasswordRecovery"

export const formatPH = (d: string) => {
  const x = d.replace(/\D/g, "").slice(0, 10)
  return [x.slice(0, 3), x.slice(3, 6), x.slice(6)].filter(Boolean).join(" ")
}
export const validPH = (d: string) => /^9\d{9}$/.test(d.replace(/\D/g, ""))
export const validEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

/** Every sign-up screen saves where the user is, so they can leave and resume. */
function useResumePoint() {
  const { setResume } = useAccount()
  const loc = useLocation()
  useEffect(() => {
    if (!isEmbed())
      setResume({
        path: loc.pathname + loc.search,
        at: new Date().toISOString(),
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search])
}

function useAside(role?: Role) {
  const t = useT()
  return role === "business"
    ? {
        asideTitle: t("Palaguin ang negosyo mo", "Grow your business"),
        asideBody: t(
          "Makita ng mga biyahero ang kainan, resort o tindahan mo.",
          "Get your restaurant, resort or shop in front of travelers.",
        ),
      }
    : {
        asideTitle: t("Tara, biyahe tayo!", "Let's go explore!"),
        asideBody: t(
          "Planuhin ang kainan at pasyalan na pasok sa budget, kasama si Jimbot.",
          "Plan food trips and getaways that fit your budget, with Jimbot.",
        ),
      }
}

function OfflineInline() {
  const t = useT()
  return (
    <div
      role="alert"
      className="mt-4 flex items-center gap-3 rounded-[18px] bg-danger-bg p-4 text-danger"
    >
      <WifiOff size={22} className="shrink-0" />
      <div>
        <p className="font-display text-[15px] font-semibold">
          {t("Walang internet", "No internet connection")}
        </p>
        <p className="text-[14px]">
          {t(
            "Naka-save ang progress mo. Subukan ulit kapag may signal na.",
            "Your progress is saved. Try again when you have signal.",
          )}
        </p>
      </div>
    </div>
  )
}

export function PhFlag() {
  return (
    <svg
      width="22"
      height="15"
      viewBox="0 0 22 15"
      aria-hidden
      className="shrink-0 rounded-[3px]"
    >
      <rect width="22" height="7.5" fill="#0038A8" />
      <rect y="7.5" width="22" height="7.5" fill="#CE1126" />
      <path d="M0 0 L12 7.5 L0 15 Z" fill="#fff" />
      <circle cx="4.2" cy="7.5" r="1.7" fill="#FCD116" />
    </svg>
  )
}

function LockedCard({ until }: { until: number }) {
  const t = useT()
  const left = useCountdown(until)
  if (!left) return null
  return (
    <div
      role="alert"
      className="mt-4 flex items-center gap-3 rounded-[18px] bg-danger-bg p-4 text-danger"
    >
      <Lock size={22} className="shrink-0" />
      <div>
        <p className="font-display text-[15px] font-semibold">
          {t("Masyadong maraming subok", "Too many attempts")}
        </p>
        <p className="text-[14px]">
          {t(
            `Naka-lock nang 5 minuto para sa seguridad. Subukan ulit sa ${mmss(left)}.`,
            `Locked for 5 minutes for your security. Try again in ${mmss(left)}.`,
          )}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------ Step 1: Role ------------------------------ */

export function RoleStep() {
  useResumePoint()
  const {
    role,
    setRole,
    roleSelectionRequired,
    setRoleSelectionRequired,
    continueAsGuest,
  } = useAccount()
  const { t } = useLang()
  const aside = useAside(role)
  const navigate = useNavigate()
  return (
    <FlowLayout
      pose="pointing"
      {...aside}
      header={<StepHeader step={1} onBack={() => navigate("/welcome")} />}
      footer={
        <>
          <Button
            block
            size="lg"
            disabled={roleSelectionRequired}
            onClick={() => navigate("/auth?mode=signup")}
          >
            {t("Magpatuloy", "Continue")}
          </Button>
          <button
            onClick={() => {
              continueAsGuest()
              navigate("/")
            }}
            className="h-11 w-full font-display text-[14px] font-medium text-fg-2"
          >
            {t("Mag-explore muna bilang guest", "Explore first as a guest")}
          </button>
        </>
      }
    >
      <h1 className="mt-2 text-title">
        {t("Sino ka sa Bitinary?", "Who are you on Bitinary?")}
      </h1>
      <p className="mt-1 text-body text-fg-2">
        {t(
          "Pumili ng isa. Puwedeng palitan mamaya.",
          "Pick one. You can change it later.",
        )}
      </p>
      <div
        className="mt-6 space-y-3"
        role="radiogroup"
        aria-label={t("Uri ng account", "Account type")}
      >
        <SelectCard
          selected={!roleSelectionRequired && role === "traveler"}
          onClick={() => {
            setRole("traveler")
            setRoleSelectionRequired(false)
          }}
          icon={<Utensils size={26} />}
          title={t("Biyahero", "Traveler")}
          body={t(
            "Maghanap ng kainan at pasyalan, gumawa ng itinerary.",
            "Find food and places, build itineraries.",
          )}
        />
        <SelectCard
          selected={!roleSelectionRequired && role === "business"}
          onClick={() => {
            setRole("business")
            setRoleSelectionRequired(false)
          }}
          icon={<Store size={26} />}
          title={t("Negosyo", "Business")}
          body={t(
            "Ilista ang kainan, resort, tour o tindahan mo.",
            "List your restaurant, resort, tour or shop.",
          )}
        />
      </div>
      <SavedNote className="mt-6" />
    </FlowLayout>
  )
}

/* ------------------------------ Step 2: Method ------------------------------ */

function MethodButton({
  icon,
  label,
  sub,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  sub?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[68px] w-full items-center gap-4 rounded-[20px] border border-line bg-surface px-4 text-left shadow-card transition-opacity disabled:opacity-50 dark:bg-elevated"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken dark:bg-bg">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-semibold leading-tight">
          {label}
        </span>
        {sub && <span className="text-[13px] text-fg-2">{sub}</span>}
      </span>
      <ChevronRight size={20} className="text-muted" />
    </motion.button>
  )
}

export function MethodStep() {
  useResumePoint()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const online = useOnline()
  const account = useAccount()
  const { showToast } = useStore()
  const { t } = useLang()
  const mode = params.get("mode") === "login" ? "login" : "signup"
  const aside = useAside(account.role)
  const handledUser = useRef<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    if (account.session?.kind !== "user") return
    const userId = account.session.accountId
    if (!userId || handledUser.current === userId) return
    const intent = sessionStorage.getItem(AUTH_INTENT_KEY)
    if (mode === "login" && intent !== "login") return
    if (intent === "login" && window.location.hash.includes("access_token"))
      return
    const isLogin = mode === "login" || intent === "login"
    const landing = authLandingPath(mode, intent, account.role)
    handledUser.current = userId

    void (async () => {
      let preserveBusinessSignupIntent = false
      if (!isLogin && intent === "signup" && account.session?.kind === "user") {
        const { data, error: getUserError } = await supabase.auth.getUser()
        if (getUserError) {
          showToast({
            text: `Could not verify your account type: ${getUserError.message}`,
            expression: "sleeping",
          })
          preserveBusinessSignupIntent = account.role === "business"
        } else if (data.user?.user_metadata?.role !== account.role) {
          const { error } = await supabase.auth.updateUser({
            data: { role: account.role },
          })
          if (error) {
            showToast({
              text: `Could not save your account type: ${error.message}`,
              expression: "sleeping",
            })
            preserveBusinessSignupIntent = account.role === "business"
          }
        }
      }

      account.setSetupDone(isLogin || account.role === "business")
      account.setResume(null)
      if (!preserveBusinessSignupIntent) {
        sessionStorage.removeItem(AUTH_INTENT_KEY)
        sessionStorage.removeItem(AUTH_ROLE_KEY)
      }
      navigate(landing, { replace: true })
    })()
  }, [account.session, account.role, mode, navigate, showToast])

  const google = async () => {
    const result = await account.signInWithGoogle(mode)
    if (result.error) {
      sessionStorage.removeItem(AUTH_INTENT_KEY)
      sessionStorage.removeItem(AUTH_ROLE_KEY)
      showToast({ text: result.error, expression: "sleeping" })
    }
  }

  return (
    <FlowLayout
      pose="waving"
      {...aside}
      header={
        <StepHeader
          step={2}
          onBack={() =>
            navigate(mode === "login" ? "/welcome" : "/signup/role")
          }
        />
      }
    >
      <Segmented
        className="mt-1 w-full"
        label={t("Mag-sign up o mag-log in", "Sign up or log in")}
        value={mode}
        onChange={(m) => {
          setAcceptedTerms(false)
          setParams({ mode: m }, { replace: true })
        }}
        options={[
          { value: "signup", label: t("Mag-sign up", "Sign up") },
          { value: "login", label: t("Mag-log in", "Log in") },
        ]}
      />
      <h1 className="mt-6 text-title">
        {mode === "signup"
          ? t("Paano ka magsa-sign up?", "How do you want to sign up?")
          : t("Maligayang pagbabalik!", "Welcome back!")}
      </h1>
      <p className="mt-1 text-body text-fg-2">
        {mode === "signup"
          ? account.role === "business"
            ? t(
                "Gagawa tayo ng account para sa negosyo mo.",
                "We'll create an account for your business.",
              )
            : t(
                "Magpatuloy gamit ang email at password o Google.",
                "Continue with email and password or Google.",
              )
          : t(
              "Gamitin ang paraang ginamit mo noong nag-sign up.",
              "Use the method you signed up with.",
            )}
      </p>
      {!online && <OfflineInline />}
      <div className="mt-6 space-y-3">
        <MethodButton
          disabled={!online || (mode === "signup" && !acceptedTerms)}
          icon={<GoogleLogo size={22} />}
          label={t("Magpatuloy gamit ang Google", "Continue with Google")}
          sub={t("Pinakamabilis, walang code", "Fastest, no code needed")}
          onClick={google}
        />
        <MethodButton
          disabled={!online || (mode === "signup" && !acceptedTerms)}
          icon={<Mail size={20} className="text-link" />}
          label={t("Gamit ang email at password", "Continue with email and password")}
          sub={t("Gumamit ng email at password", "Use your email and password")}
          onClick={() => navigate(`/auth/email?mode=${mode}`)}
        />
      </div>
      {mode === "signup" && (
        <TermsConsentCard
          checked={acceptedTerms}
          onCheckedChange={setAcceptedTerms}
          t={t}
        />
      )}
      {mode === "signup" && (
        <p className="mt-5 text-center text-[14px] text-fg-2">
          {t("Bilang", "Signing up as")}{" "}
          <b className="text-fg">
            {account.role === "business"
              ? t("Negosyo", "Business")
              : t("Biyahero", "Traveler")}
          </b>{" "}
          ·{" "}
          <button
            onClick={() => navigate("/signup/role")}
            className="font-semibold text-link underline underline-offset-2"
          >
            {t("Palitan", "Change")}
          </button>
        </p>
      )}
    </FlowLayout>
  )
}

/* ------------------------------ Step 2b: contact entry ------------------------------ */

export function ContactStep() {
  useResumePoint()
  const [params] = useSearchParams()
  const forced = getForcedState()
  const mode = params.get("mode") === "login" ? "login" : "signup"
  const navigate = useNavigate()
  const online = useOnline()
  const account = useAccount()
  const { t } = useLang()
  const [value, setValue] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(
    forced === "used" || forced === "invalid" ? forced : null,
  )
  const [busy, setBusy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>()
  const captchaRef = useRef<TurnstileInstance | null>(null)
  const [lockAt] = useState(() =>
    forced === "locked" ? Date.now() + 299_000 : account.lockedUntil,
  )
  const lockLeft = useCountdown(lockAt)
  const aside = useAside(account.role)

  useEffect(() => {
    sessionStorage.setItem("bitinary:draft-email", value)
  }, [value])

  const submit = async () => {
    const ok = validEmail(value)
    if (!ok) return setError("invalid")
    if (password.length < 8) return setError("Use a password with at least 8 characters.")
    if (mode === "signup" && password !== confirmPassword) return setError("Passwords do not match.")
    setBusy(true)
    const to = value.trim().toLowerCase()
    try {
      const result = mode === "signup"
        ? await signUpWithEmailPassword(to, password, account.role, "auth/callback", captchaToken)
        : await signInWithEmailPassword(to, password, captchaToken)
      if (result.error) {
        setError(result.error)
        return
      }
      if (mode === "signup" && !result.hasSession) {
        navigate(`/auth/verify?to=${encodeURIComponent(to)}&mode=signup`)
      } else {
        navigate(`/auth?mode=${mode}`, { replace: true })
      }
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Could not complete email authentication.")
    } finally {
      setBusy(false)
      captchaRef.current?.reset()
      setCaptchaToken(undefined)
    }
  }

  const errorMessage =
    error === "invalid"
      ? t(
          "Mukhang mali ang email. Tingnan ulit.",
          "That email doesn't look right. Check again.",
        )
      : error === "Passwords do not match."
        ? t("Hindi magkapareho ang password.", "Passwords do not match.")
        : error === "used"
          ? t("Gamit na ang email na ito. Mag-log in o i-reset ang password.", "This email is already in use. Sign in or reset your password.")
        : error?.startsWith("Use a password")
          ? t("Gumamit ng password na hindi bababa sa 8 character.", "Use a password with at least 8 characters.")
          : error

  return (
    <FlowLayout
      pose="waving"
      {...aside}
      header={
        <StepHeader step={2} onBack={() => navigate(`/auth?mode=${mode}`)} />
      }
      footer={
        <Button
          block
          size="lg"
          onClick={submit}
          disabled={
            !value ||
            password.length < 8 ||
            (mode === "signup" && password !== confirmPassword) ||
            !online ||
            lockLeft > 0 ||
            busy ||
            (!!turnstileSiteKey && !captchaToken)
          }
        >
          {mode === "signup" ? t("Gumawa ng account", "Create account") : t("Mag-sign in", "Sign in")}
        </Button>
      }
    >
      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-ink">
        <AtSign size={30} />
      </div>
      <h1 className="mt-4 text-title">
        {t("Ano ang email mo?", "What's your email?")}
      </h1>
      <p className="mt-1 text-body text-fg-2">
        {mode === "signup"
          ? t("Gumawa ng account gamit ang email at password.", "Create your account with an email and password.")
          : t("Mag-sign in gamit ang email at password mo.", "Sign in with your email and password.")}
      </p>
      <div className="mt-6">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="juan@email.com"
          value={value}
          onChange={(e) => (setValue(e.target.value), setError(null))}
          error={error ? errorMessage : null}
        />
        <div className="mt-4 space-y-3">
          <PasswordField
            label={t("Password", "Password")}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => (setPassword(e.target.value), setError(null))}
            error={null}
          />
          {mode === "signup" && (
            <>
              <StrengthMeter password={password} />
              <PasswordField
                label={t("Kumpirmahin ang password", "Confirm password")}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => (setConfirmPassword(e.target.value), setError(null))}
                error={null}
              />
            </>
          )}
        </div>
        {turnstileSiteKey && (
          <div className="mt-4">
            <Turnstile
              ref={captchaRef}
              siteKey={turnstileSiteKey}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(undefined)}
              onError={() => setCaptchaToken(undefined)}
            />
          </div>
        )}
        {mode === "login" && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => navigate(`/auth/recovery?email=${encodeURIComponent(value.trim().toLowerCase())}`)}
          >
            {t("Nakalimutan ang password?", "Forgot password?")}
          </Button>
        )}
      </div>
      {!online && <OfflineInline />}
      {lockLeft > 0 && <LockedCard until={lockAt} />}
      <SavedNote className="mt-6" />
    </FlowLayout>
  )
}

/* ------------------------------ Step 3: Email confirmation ------------------------------ */

export function VerifyStep() {
  useResumePoint()
  const [params] = useSearchParams()
  const to = params.get("to") ?? ""
  const mode = params.get("mode") === "login" ? "login" : "signup"
  const { showToast } = useStore()
  const { t } = useLang()
  const navigate = useNavigate()
  const online = useOnline()
  const [resendAt, setResendAt] = useState(() => Date.now() + 30_000)
  const resendLeft = useCountdown(resendAt)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resend = async () => {
    setBusy(true)
    const result = await resendSignupConfirmation(to)
    setBusy(false)
    if (result.error) return setError(result.error)
    setError(null)
    setResendAt(Date.now() + 30_000)
    showToast({
      text: t("Nagpadala ng bagong verification email", "A new verification email was sent"),
      expression: "pointing",
    })
  }

  return (
    <FlowLayout
      pose="pointing"
      asideTitle={t("Isang hakbang na lang!", "Almost there!")}
      asideBody={t(
        "Buksan ang verification email para kumpirmahin ang account mo.",
        "Open the verification email to confirm your account.",
      )}
      header={
        <StepHeader
          step={3}
          onBack={() => navigate(`/auth/email?mode=${mode}`)}
        />
      }
    >
      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-ink">
        <Mail size={30} />
      </div>
      <h1 className="mt-4 text-title">
        {t("Kumpirmahin ang email mo", "Confirm your email")}
      </h1>
      <p className="mt-1 text-body text-fg-2">
        {t("Nagpadala kami ng verification email sa", "We sent a verification email to")}{" "}
        <b className="text-fg">{to}</b>.{" "}
        {t("Buksan ito para kumpirmahin ang account mo.", "Open it to confirm your account.")}
      </p>
      {error && (
        <p role="alert" className="mt-4 text-[14px] font-semibold text-danger">
          {t(`Hindi naipadala: ${error}`, `Could not send email: ${error}`)}
        </p>
      )}
      {!online && <OfflineInline />}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        {resendLeft > 0 ? (
          <span className="font-display text-[15px] text-fg-2">
            {t(
              `Ipadala ulit sa ${mmss(resendLeft)}`,
              `Resend in ${mmss(resendLeft)}`,
            )}
          </span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={!online || busy}
            onClick={() => void resend()}
          >
            {busy
              ? t("Ipinapadala…", "Sending…")
              : t("Ipadala ulit ang email", "Resend email")}
          </Button>
        )}
        <button
          onClick={() => navigate(`/auth/email?mode=${mode}`)}
          className="h-11 font-display text-[15px] font-medium text-link"
        >
          {t("Palitan ang email", "Change email")}
        </button>
      </div>
      <div className="mt-8 flex items-start gap-3 rounded-[18px] bg-sunken p-4 text-[14px] text-fg-2 dark:bg-elevated">
        <p>
          {t(
            "Tingnan din ang spam o junk folder.",
            "Check your spam or junk folder too.",
          )}
        </p>
      </div>
    </FlowLayout>
  )
}

export function EmailAuthCallback() {
  const [params] = useSearchParams()
  const mode = params.get("mode") === "login" ? "login" : "signup"
  const to = params.get("to") ?? ""
  const navigate = useNavigate()
  const { t } = useLang()
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return
        if (sessionError) {
          setError(sessionError.message)
        } else if (!data.session) {
          setError(
            t(
              "Hindi valid o expired na ang link. Humingi ng bagong link.",
              "This link is invalid or expired. Request a new link.",
            ),
          )
        } else if (data.session.user.user_metadata?.role === "business") {
          sessionStorage.removeItem(AUTH_INTENT_KEY)
          sessionStorage.removeItem(AUTH_ROLE_KEY)
          navigate(`/biz/auth/callback?mode=${mode}`, { replace: true })
        } else if (mode === "login") {
          sessionStorage.removeItem(AUTH_INTENT_KEY)
          sessionStorage.removeItem(AUTH_ROLE_KEY)
          navigate("/", { replace: true })
        } else {
          sessionStorage.removeItem(AUTH_INTENT_KEY)
          sessionStorage.removeItem(AUTH_ROLE_KEY)
          navigate("/signup/name", { replace: true })
        }
        setChecking(false)
      })
      .catch((sessionError: unknown) => {
        if (active) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Could not verify the email.",
          )
          setChecking(false)
        }
      })
    return () => {
      active = false
    }
  }, [mode, navigate, t])

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-10 text-fg">
      <section
        role={error ? "alert" : "status"}
        className="w-full max-w-md rounded-[28px] bg-surface p-7 text-center shadow-card"
      >
        <Mail size={32} className="mx-auto text-primary" />
        <h1 className="mt-4 text-h2">
          {checking
            ? t("Sinusuri ang verification…", "Verifying your email…")
            : error
              ? t("Hindi makumpirma ang email", "Could not verify email")
              : t("Tagumpay", "Success")}
        </h1>
        {error && <p className="mt-2 text-body text-fg-2">{error}</p>}
        {error && (
          <Button
            className="mt-5"
            onClick={() =>
              navigate(
                mode === "signup" && to
                  ? `/auth/verify?to=${encodeURIComponent(to)}&mode=signup`
                  : `/auth/email?mode=${mode}`,
                { replace: true },
              )
            }
          >
            {mode === "signup"
              ? t("Ipadala ulit ang verification email", "Resend verification email")
              : t("Bumalik sa pag-sign in", "Back to sign in")}
          </Button>
        )}
      </section>
    </main>
  )
}

export function PasswordRecoveryStep() {
  const { t } = useLang()
  return <PasswordRecoveryPage business={false} t={t} />
}

/* ------------------------------ Step 4: Name ------------------------------ */

export function NameStep() {
  useResumePoint()
  const { profile, setProfile, role, setSetupDone, setResume } = useAccount()
  const { t } = useLang()
  const navigate = useNavigate()
  const [error, setError] = useState(getForcedState() === "error")
  const nameOk = profile.name.trim().length >= 2
  const next = () => {
    if (!nameOk) return setError(true)
    if (!profile.nickname.trim())
      setProfile((p) => ({ ...p, nickname: p.name.trim().split(/\s+/)[0] }))
    if (role === "business") {
      setSetupDone(true)
      setResume(null)
      navigate("/biz", { replace: true })
      return
    }
    setSetupDone(false)
    setResume({ path: "/personalize", at: new Date().toISOString() })
    navigate("/personalize", { replace: true })
  }
  return (
    <FlowLayout
      pose="waving"
      asideTitle={t("Ikinagagalak kitang makilala!", "Nice to meet you!")}
      asideBody={t(
        "Ganito ka tatawagin ni Jimbot sa app.",
        "This is how Jimbot will greet you.",
      )}
      header={<StepHeader step={4} onBack={() => navigate(-1)} />}
      footer={
        <Button block size="lg" onClick={next}>
          {t("Magpatuloy", "Continue")}
        </Button>
      }
    >
      <div className="flex items-end gap-1 md:hidden">
        <Jimbot
          expression="waving"
          variant="standalone"
          size={132}
          className="-ml-2"
        />
        <div className="mb-6 rounded-[20px] rounded-bl-md bg-surface px-4 py-2.5 font-display text-[15px] font-medium shadow-card dark:bg-elevated">
          {t("Kumusta! Ano ang pangalan mo?", "Hi! What's your name?")}
        </div>
      </div>
      <h1 className="mt-2 text-title">
        {t("Ano ang pangalan mo?", "What's your name?")}
      </h1>
      <div className="mt-6 space-y-5">
        <TextField
          label={t("Buong pangalan", "Full name")}
          autoComplete="name"
          placeholder="Juan Dela Cruz"
          value={profile.name}
          onChange={(e) => (
            setProfile((p) => ({ ...p, name: e.target.value })), setError(false)
          )}
          error={
            error && !nameOk
              ? t(
                  "Ilagay ang pangalan mo (kahit 2 letra).",
                  "Enter your name (at least 2 letters).",
                )
              : null
          }
        />
        <TextField
          label={t("Palayaw", "Nickname")}
          optional
          autoComplete="nickname"
          placeholder={profile.name.trim().split(/\s+/)[0] || "Juan"}
          value={profile.nickname}
          onChange={(e) =>
            setProfile((p) => ({ ...p, nickname: e.target.value }))
          }
          hint={t(
            "Ganito ka babatiin ni Jimbot.",
            "How Jimbot will greet you.",
          )}
        />
      </div>
      <SavedNote className="mt-6" />
    </FlowLayout>
  )
}

/* ------------------------------ Step 5: Ready ------------------------------ */

export function ReadyStep() {
  const { profile, setPrefs, setResume } = useAccount()
  const { t } = useLang()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isEmbed()) setResume(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const nick = profile.nickname || profile.name.split(" ")[0] || "Biyahero"
  return (
    <SuccessScreen
      title={t("Handa na ang account mo!", "Your account is ready!")}
      body={t(
        `Salamat, ${nick}! Gusto mo bang turuan si Jimbot ng mga gusto mo? Mga 2 minuto lang bawat tema.`,
        `Thanks, ${nick}! Want to teach Jimbot what you like? About 2 minutes per theme.`,
      )}
      chip={
        <span className="rounded-full bg-ink/85 px-3.5 py-1.5 font-display text-[13px] font-semibold text-cream">
          {t("Hakbang 5 sa 5", "Step 5 of 5")}
        </span>
      }
      actions={
        <>
          <Button block size="lg" onClick={() => navigate("/personalize")}>
            {t("Mag-personalize ngayon", "Personalize now")}
          </Button>
          <Button
            block
            variant="ghost"
            className={cn("!h-12")}
            onClick={() => {
              setPrefs((current) => skipAllTravelerPreferences(current))
              navigate("/", { replace: true })
            }}
          >
            {t("Laktawan muna", "Skip for now")}
          </Button>
        </>
      }
    />
  )
}
