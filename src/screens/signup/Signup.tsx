import { AtSign, ChevronRight, Lock, Mail, ShieldCheck, Store, Utensils, WifiOff } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { MAX_ATTEMPTS, useAccount, type Role } from '@/app/account'
import { useLang, useT } from '@/app/i18n'
import { useStore } from '@/app/store'
import { FlowLayout } from '@/components/flow/FlowLayout'
import { GoogleLogo, OtpInput, SelectCard, TextField } from '@/components/flow/Fields'
import { Jimbot } from '@/components/mascot/Jimbot'
import { SavedNote, StepHeader } from '@/components/onboarding/Kit'
import { SuccessScreen } from '@/components/onboarding/Templates'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'
import { getForcedState, isEmbed } from '@/lib/forced'
import { mmss, useCountdown } from '@/lib/useCountdown'
import { useOnline } from '@/lib/useOnline'

export const formatPH = (d: string) => {
  const x = d.replace(/\D/g, '').slice(0, 10)
  return [x.slice(0, 3), x.slice(3, 6), x.slice(6)].filter(Boolean).join(' ')
}
export const validPH = (d: string) => /^9\d{9}$/.test(d.replace(/\D/g, ''))
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

/** Every sign-up screen saves where the user is, so they can leave and resume. */
function useResumePoint() {
  const { setResume } = useAccount()
  const loc = useLocation()
  useEffect(() => {
    if (!isEmbed()) setResume({ path: loc.pathname + loc.search, at: new Date().toISOString() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search])
}

function useAside(role?: Role) {
  const t = useT()
  return role === 'business'
    ? { asideTitle: t('Palaguin ang negosyo mo', 'Grow your business'), asideBody: t('Makita ng mga biyahero ang kainan, resort o tindahan mo.', 'Get your restaurant, resort or shop in front of travelers.') }
    : { asideTitle: t('Tara, biyahe tayo!', "Let's go explore!"), asideBody: t('Planuhin ang kainan at pasyalan na pasok sa budget, kasama si Jimbot.', 'Plan food trips and getaways that fit your budget, with Jimbot.') }
}

function OfflineInline() {
  const t = useT()
  return (
    <div role="alert" className="mt-4 flex items-center gap-3 rounded-[18px] bg-danger-bg p-4 text-danger">
      <WifiOff size={22} className="shrink-0" />
      <div>
        <p className="font-display text-[15px] font-semibold">{t('Walang internet', 'No internet connection')}</p>
        <p className="text-[14px]">{t('Naka-save ang progress mo. Subukan ulit kapag may signal na.', 'Your progress is saved. Try again when you have signal.')}</p>
      </div>
    </div>
  )
}

export function PhFlag() {
  return (
    <svg width="22" height="15" viewBox="0 0 22 15" aria-hidden className="shrink-0 rounded-[3px]">
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
    <div role="alert" className="mt-4 flex items-center gap-3 rounded-[18px] bg-danger-bg p-4 text-danger">
      <Lock size={22} className="shrink-0" />
      <div>
        <p className="font-display text-[15px] font-semibold">{t('Masyadong maraming subok', 'Too many attempts')}</p>
        <p className="text-[14px]">{t(`Naka-lock nang 5 minuto para sa seguridad. Subukan ulit sa ${mmss(left)}.`, `Locked for 5 minutes for your security. Try again in ${mmss(left)}.`)}</p>
      </div>
    </div>
  )
}

/* ------------------------------ Step 1: Role ------------------------------ */

export function RoleStep() {
  useResumePoint()
  const { role, setRole, continueAsGuest } = useAccount()
  const { t } = useLang()
  const aside = useAside(role)
  const navigate = useNavigate()
  return (
    <FlowLayout
      pose="pointing"
      {...aside}
      header={<StepHeader step={1} onBack={() => navigate('/welcome')} />}
      footer={
        <>
          <Button block size="lg" onClick={() => navigate('/auth?mode=signup')}>
            {t('Magpatuloy', 'Continue')}
          </Button>
          <button
            onClick={() => {
              continueAsGuest()
              navigate('/')
            }}
            className="h-11 w-full font-display text-[14px] font-medium text-fg-2"
          >
            {t('Mag-explore muna bilang guest', 'Explore first as a guest')}
          </button>
        </>
      }
    >
      <h1 className="mt-2 text-title">{t('Sino ka sa Bitinary?', 'Who are you on Bitinary?')}</h1>
      <p className="mt-1 text-body text-fg-2">{t('Pumili ng isa. Puwedeng palitan mamaya.', 'Pick one. You can change it later.')}</p>
      <div className="mt-6 space-y-3" role="radiogroup" aria-label={t('Uri ng account', 'Account type')}>
        <SelectCard selected={role === 'traveler'} onClick={() => setRole('traveler')} icon={<Utensils size={26} />} title={t('Biyahero', 'Traveler')} body={t('Maghanap ng kainan at pasyalan, gumawa ng itinerary.', 'Find food and places, build itineraries.')} />
        <SelectCard selected={role === 'business'} onClick={() => setRole('business')} icon={<Store size={26} />} title={t('Negosyo', 'Business')} body={t('Ilista ang kainan, resort, tour o tindahan mo.', 'List your restaurant, resort, tour or shop.')} />
      </div>
      <SavedNote className="mt-6" />
    </FlowLayout>
  )
}

/* ------------------------------ Step 2: Method ------------------------------ */

function MethodButton({ icon, label, sub, onClick, disabled }: { icon: ReactNode; label: string; sub?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[68px] w-full items-center gap-4 rounded-[20px] border border-line bg-surface px-4 text-left shadow-card transition-opacity disabled:opacity-50 dark:bg-elevated"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken dark:bg-bg">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-semibold leading-tight">{label}</span>
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
  const mode = params.get('mode') === 'login' ? 'login' : 'signup'
  const aside = useAside(account.role)

  useEffect(() => {
    if (account.session?.kind !== 'user') return
    const intent = sessionStorage.getItem('bitinary:auth-intent')
    const isLogin = mode === 'login' || intent === 'login'
    account.setSetupDone(isLogin)
    account.setResume(null)
    sessionStorage.removeItem('bitinary:auth-intent')
    navigate(isLogin ? '/' : '/signup/name', { replace: true })
  }, [account.session, mode, navigate])

  const google = async () => {
    const result = await account.signInWithGoogle(mode)
    if (result.error) showToast({ text: result.error, expression: 'sad' })
  }

  return (
    <FlowLayout pose="waving" {...aside} header={<StepHeader step={2} onBack={() => navigate(mode === 'login' ? '/welcome' : '/signup/role')} />}>
      <Segmented
        className="mt-1 w-full"
        label={t('Mag-sign up o mag-log in', 'Sign up or log in')}
        value={mode}
        onChange={(m) => setParams({ mode: m }, { replace: true })}
        options={[
          { value: 'signup', label: t('Mag-sign up', 'Sign up') },
          { value: 'login', label: t('Mag-log in', 'Log in') },
        ]}
      />
      <h1 className="mt-6 text-title">{mode === 'signup' ? t('Paano ka magsa-sign up?', 'How do you want to sign up?') : t('Maligayang pagbabalik!', 'Welcome back!')}</h1>
      <p className="mt-1 text-body text-fg-2">
        {mode === 'signup'
          ? account.role === 'business'
            ? t('Gagawa tayo ng account para sa negosyo mo.', "We'll create an account for your business.")
            : t('Pumili ng isa. Walang password na kailangang tandaan.', 'Pick one. No password to remember.')
          : t('Gamitin ang paraang ginamit mo noong nag-sign up.', 'Use the method you signed up with.')}
      </p>
      {!online && <OfflineInline />}
      <div className="mt-6 space-y-3">
        <MethodButton disabled={!online} icon={<GoogleLogo size={22} />} label={t('Magpatuloy gamit ang Google', 'Continue with Google')} sub={t('Pinakamabilis, walang code', 'Fastest, no code needed')} onClick={google} />
        <MethodButton disabled={!online} icon={<Mail size={20} className="text-link" />} label={t('Gamit ang email', 'Continue with email')} sub={t('Code sa email', 'Code by email')} onClick={() => navigate(`/auth/email?mode=${mode}`)} />
      </div>
      {mode === 'signup' && (
        <p className="mt-5 text-center text-[14px] text-fg-2">
          {t('Bilang', 'Signing up as')} <b className="text-fg">{account.role === 'business' ? t('Negosyo', 'Business') : t('Biyahero', 'Traveler')}</b> ·{' '}
          <button onClick={() => navigate('/signup/role')} className="font-semibold text-link underline underline-offset-2">
            {t('Palitan', 'Change')}
          </button>
        </p>
      )}
      <p className="mt-6 text-center text-[13px] leading-snug text-fg-2">{t('Sa pagpapatuloy, sumasang-ayon ka sa Terms at Privacy Policy (RA 10173).', 'By continuing you agree to the Terms and Privacy Policy (RA 10173).')}</p>

    </FlowLayout>
  )
}

/* ------------------------------ Step 2b: contact entry ------------------------------ */

export function ContactStep() {
  useResumePoint()
  const [params] = useSearchParams()
  const forced = getForcedState()
  const mode = params.get('mode') === 'login' ? 'login' : 'signup'
  const navigate = useNavigate()
  const online = useOnline()
  const account = useAccount()
  const { t } = useLang()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(forced === 'used' || forced === 'invalid' ? forced : null)
  const [busy, setBusy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>()
  const captchaRef = useRef<TurnstileInstance | null>(null)
  const [lockAt] = useState(() => (forced === 'locked' ? Date.now() + 299_000 : account.lockedUntil))
  const lockLeft = useCountdown(lockAt)
  const aside = useAside(account.role)

  useEffect(() => {
    sessionStorage.setItem('bitinary:draft-email', value)
  }, [value])

  const submit = async () => {
    const ok = validEmail(value)
    if (!ok) return setError('invalid')
    setBusy(true)
    const to = value.trim().toLowerCase()
    const result = await account.sendOtp({ email: to }, mode === 'signup', captchaToken)
    setBusy(false)
    if (result.error) {
      captchaRef.current?.reset()
      setCaptchaToken(undefined)
      return setError(result.error)
    }
    captchaRef.current?.reset()
    setCaptchaToken(undefined)
    navigate(`/auth/verify?to=${encodeURIComponent(to)}&mode=${mode}`)
  }

  const errorMessage = error === 'invalid'
    ? t('Mukhang mali ang email. Tingnan ulit.', "That email doesn't look right. Check again.")
    : error === 'used'
      ? t('Gamit na ang email na ito sa ibang account.', 'This email is already used by another account.')
      : mode === 'login'
        ? t('Walang account na naka-link dito. Siguraduhing naka-enable ang Email provider sa Supabase.', 'No account is linked to this email. Make sure the Email provider is enabled in Supabase.')
        : t(`Hindi maipadala ang code: ${error ?? ''}`, `Could not send the code: ${error ?? ''}`)

  return (
    <FlowLayout
      pose="waving"
      {...aside}
      header={<StepHeader step={2} onBack={() => navigate(`/auth?mode=${mode}`)} />}
      footer={
        <Button block size="lg" onClick={submit} disabled={!value || !online || lockLeft > 0 || busy || (mode === 'signup' && !!import.meta.env.VITE_TURNSTILE_SITE_KEY && !captchaToken)}>
          {t('Ipadala ang code', 'Send code')}
        </Button>
      }
    >
      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-ink"><AtSign size={30} /></div>
      <h1 className="mt-4 text-title">{t('Ano ang email mo?', "What's your email?")}</h1>
      <p className="mt-1 text-body text-fg-2">{t('Magpapadala kami ng 6-digit na code para ma-verify ito.', "We'll send a 6-digit code to verify it.")}</p>
      <div className="mt-6">
        <TextField label="Email" type="email" autoComplete="email" autoFocus placeholder="juan@email.com" value={value} onChange={(e) => (setValue(e.target.value), setError(null))} error={error ? errorMessage : null} />
        {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
          <div className="mt-4">
            <Turnstile ref={captchaRef} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken(undefined)} onError={() => setCaptchaToken(undefined)} />
          </div>
        )}
        {error === 'used' && (
          <Button variant="secondary" className="mt-3" onClick={() => navigate('/auth/email?mode=login')}>
            {t('Mag-log in na lang', 'Log in instead')}
          </Button>
        )}
        {error && mode === 'login' && (
          <Button variant="secondary" className="mt-3" onClick={() => navigate('/signup/role')}>
            {t('Mag-sign up gamit ang email', 'Sign up with email')}
          </Button>
        )}
      </div>
      {!online && <OfflineInline />}
      {lockLeft > 0 && <LockedCard until={lockAt} />}
      <SavedNote className="mt-6" />
    </FlowLayout>
  )
}

/* ------------------------------ Step 3: Verify ------------------------------ */

export function VerifyStep() {
  useResumePoint()
  const [params] = useSearchParams()
  const forced = getForcedState()
  const to = params.get('to') ?? ''
  const mode = params.get('mode') === 'login' ? 'login' : 'signup'
  const account = useAccount()
  const { showToast } = useStore()
  const { t } = useLang()
  const navigate = useNavigate()
  const online = useOnline()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(
    forced === 'wrong' ? t('Mali ang code. May 4 pang subok.', 'Wrong code. 4 tries left.') : null,
  )
  const [resendAt, setResendAt] = useState(() => Date.now() + 30_000)
  const resendLeft = useCountdown(resendAt)
  const [lockedUntil] = useState(() => (forced === 'locked' ? Date.now() + 299_000 : 0))
  const lockLeft = useCountdown(lockedUntil || account.lockedUntil)
  const [busy, setBusy] = useState(false)
  const shown = to

  const succeed = () => {
    account.clearFailures()
    if (mode === 'login') {
      account.setSetupDone(true)
      account.setResume(null)
      showToast({ text: t('Maligayang pagbabalik!', 'Welcome back!'), expression: 'waving' })
      return navigate('/', { replace: true })
    }
    account.setSetupDone(false)
    navigate('/signup/name', { replace: true })
  }

  const check = async (c: string) => {
    if (c.length < 6 || lockLeft > 0 || !online) return
    setBusy(true)
    const result = await account.verifyOtp({ email: to }, c)
    setBusy(false)
    if (!result.error) return succeed()
    const n = account.registerFailure()
    setError(n >= MAX_ATTEMPTS ? null : t(`Mali ang code. May ${MAX_ATTEMPTS - n} pang subok.`, `Wrong code. ${MAX_ATTEMPTS - n} tries left.`))
    setCode('')
  }

  useEffect(() => {
    if (!forced) check(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <FlowLayout
      pose="pointing"
      asideTitle={t('Isang hakbang na lang!', 'Almost there!')}
      asideBody={t('Sinisigurado lang namin na ikaw talaga ito.', "We're just making sure it's really you.")}
      header={<StepHeader step={3} onBack={() => navigate(`/auth/email?mode=${mode}`)} />}
    >
      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-ink"><Mail size={30} /></div>
      <h1 className="mt-4 text-title">{t('Ilagay ang email code', 'Enter the email code')}</h1>
      <p className="mt-1 text-body text-fg-2">
        {t('Nagpadala kami ng 6-digit na code sa', 'We sent a 6-digit code to')} <b className="text-fg">{shown}</b>.
      </p>
      <div className="mt-6">
        <OtpInput value={code} onChange={(v) => (setCode(v), setError(null))} error={!!error} disabled={lockLeft > 0 || busy || !online} />
        {error && (
          <p role="alert" className="mt-3 text-[14px] font-semibold text-danger">
            {error}
          </p>
        )}
        {busy && <p className="mt-3 text-[14px] text-fg-2">{t('Sinusuri…', 'Checking…')}</p>}
      </div>
      {!online && <OfflineInline />}
      {lockLeft > 0 && <LockedCard until={lockedUntil || account.lockedUntil} />}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        {resendLeft > 0 ? (
          <span className="font-display text-[15px] text-fg-2">{t(`Ipadala ulit sa ${mmss(resendLeft)}`, `Resend in ${mmss(resendLeft)}`)}</span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={!online || lockLeft > 0}
            onClick={() => {
              account.sendOtp({ email: to }, mode === 'signup')
              setResendAt(Date.now() + 30_000)
              setError(null)
              setCode('')
              showToast({ text: t('Nagpadala ng bagong code', 'New code sent'), expression: 'pointing' })
            }}
          >
            {t('Ipadala ulit ang code', 'Resend code')}
          </Button>
        )}
        <button onClick={() => navigate(`/auth/email?mode=${mode}`)} className="h-11 font-display text-[15px] font-medium text-link">
          {t('Palitan ang email', 'Change email')}
        </button>
      </div>
      <div className="mt-8 flex items-start gap-3 rounded-[18px] bg-sunken p-4 text-[14px] text-fg-2 dark:bg-elevated">
        <ShieldCheck size={20} className="shrink-0 text-ok" />
        <p>
          {t('Huwag ibigay ang code kahit kanino.', 'Never share this code with anyone.')}
        </p>
      </div>
    </FlowLayout>
  )
}

/* ------------------------------ Step 4: Name ------------------------------ */

export function NameStep() {
  useResumePoint()
  const { profile, setProfile, role, setSetupDone, setResume } = useAccount()
  const { t } = useLang()
  const navigate = useNavigate()
  const [error, setError] = useState(getForcedState() === 'error')
  const nameOk = profile.name.trim().length >= 2
  const next = () => {
    if (!nameOk) return setError(true)
    if (!profile.nickname.trim()) setProfile((p) => ({ ...p, nickname: p.name.trim().split(/\s+/)[0] }))
    setSetupDone(true)
    if (role === 'business') setResume(null)
    navigate(role === 'business' ? '/biz' : '/signup/ready', { replace: true })
  }
  return (
    <FlowLayout
      pose="waving"
      asideTitle={t('Ikinagagalak kitang makilala!', 'Nice to meet you!')}
      asideBody={t('Ganito ka tatawagin ni Jimbot sa app.', "This is how Jimbot will greet you.")}
      header={<StepHeader step={4} onBack={() => navigate(-1)} />}
      footer={
        <Button block size="lg" onClick={next}>
          {t('Magpatuloy', 'Continue')}
        </Button>
      }
    >
      <div className="flex items-end gap-1 md:hidden">
        <Jimbot expression="waving" variant="standalone" size={132} className="-ml-2" />
        <div className="mb-6 rounded-[20px] rounded-bl-md bg-surface px-4 py-2.5 font-display text-[15px] font-medium shadow-card dark:bg-elevated">{t('Kumusta! Ano ang pangalan mo?', "Hi! What's your name?")}</div>
      </div>
      <h1 className="mt-2 text-title">{t('Ano ang pangalan mo?', "What's your name?")}</h1>
      <div className="mt-6 space-y-5">
        <TextField
          label={t('Buong pangalan', 'Full name')}
          autoComplete="name"
          placeholder="Juan Dela Cruz"
          value={profile.name}
          onChange={(e) => (setProfile((p) => ({ ...p, name: e.target.value })), setError(false))}
          error={error && !nameOk ? t('Ilagay ang pangalan mo (kahit 2 letra).', 'Enter your name (at least 2 letters).') : null}
        />
        <TextField
          label={t('Palayaw', 'Nickname')}
          optional
          autoComplete="nickname"
          placeholder={profile.name.trim().split(/\s+/)[0] || 'Juan'}
          value={profile.nickname}
          onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
          hint={t('Ganito ka babatiin ni Jimbot.', "How Jimbot will greet you.")}
        />
      </div>
      <SavedNote className="mt-6" />
    </FlowLayout>
  )
}

/* ------------------------------ Step 5: Ready ------------------------------ */

export function ReadyStep() {
  const { profile, setResume } = useAccount()
  const { t } = useLang()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isEmbed()) setResume(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const nick = profile.nickname || profile.name.split(' ')[0] || 'Biyahero'
  return (
    <SuccessScreen
      title={t('Handa na ang account mo!', 'Your account is ready!')}
      body={t(`Salamat, ${nick}! Gusto mo bang turuan si Jimbot ng mga gusto mo? Mga 2 minuto lang bawat tema.`, `Thanks, ${nick}! Want to teach Jimbot what you like? About 2 minutes per theme.`)}
      chip={<span className="rounded-full bg-ink/85 px-3.5 py-1.5 font-display text-[13px] font-semibold text-cream">{t('Hakbang 5 sa 5', 'Step 5 of 5')}</span>}
      actions={
        <>
          <Button block size="lg" onClick={() => navigate('/personalize')}>
            {t('Mag-personalize ngayon', 'Personalize now')}
          </Button>
          <Button block variant="ghost" className={cn('!h-12')} onClick={() => navigate('/', { replace: true })}>
            {t('Laktawan muna', 'Skip for now')}
          </Button>
        </>
      }
    />
  )
}
