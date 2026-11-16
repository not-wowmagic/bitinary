import { LogIn } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useConsole } from '@/app/console'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { clearBitinaryBrowserCache } from '@/lib/clearBitinaryBrowserCache'
import { supabase } from '@/lib/supabase'
import { turnstileSiteKey } from '@/lib/turnstile'
import { field } from './ui'

function Card({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5 py-10">
      <div className="card w-full max-w-[440px] p-6 md:p-8">{children}</div>
    </main>
  )
}

export async function isConsoleAdmin() {
  const { data, error } = await supabase.rpc('is_dev_console_admin')
  if (error) throw error
  return data === true
}

export function SignIn({ notice }: { notice?: string }) {
  const { update } = useConsole()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>()
  const captchaRef = useRef<TurnstileInstance | null>(null)
  const finishSignIn = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const session = sessionData.session
    if (!session?.user.email) throw new Error('We couldn’t verify your sign-in. Please try again.')
    if (!(await isConsoleAdmin())) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      await clearBitinaryBrowserCache()
      throw new Error(`The email ${session.user.email} doesn’t have developer access. Ask a project administrator to add it under Team access.`)
    }

    const now = Date.now()
    const id = session.user.id
    const name = typeof session.user.user_metadata.full_name === 'string' && session.user.user_metadata.full_name.trim()
      ? session.user.user_metadata.full_name.trim()
      : session.user.email.split('@')[0]
    update((current) => ({
      ...current,
      devAccounts: [
        ...current.devAccounts.filter((account) => account.id !== id),
        { id, name, email: session.user.email!, active: true, createdAt: new Date(now).toISOString(), lastSignIn: new Date(now).toISOString() },
      ],
      devSession: { accountId: id, at: now, lastActive: now },
    }))
  }

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
        options: { ...(captchaToken ? { captchaToken } : {}) },
      })
      if (signInError) throw signInError
      if (!data.user?.email) throw new Error('We couldn’t verify your email. Please try again.')
      if (!data.user.email_confirmed_at || !(await isConsoleAdmin())) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
        await clearBitinaryBrowserCache()
        throw new Error(!data.user.email_confirmed_at ? 'Please confirm your email address, then sign in again.' : `The email ${data.user.email} doesn’t have developer access. Ask a project administrator to add it under Team access.`)
      }
      await finishSignIn()
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.'
      setError(/captcha_token|captcha token/i.test(message)
        ? 'Complete the CAPTCHA check, then try signing in again. If it doesn’t appear, ask an administrator to check the CAPTCHA setup.'
        : message)
    } finally {
      captchaRef.current?.reset()
      setCaptchaToken(undefined)
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex justify-center">
        <Jimbot expression="waving" variant="standalone" size={100} />
      </div>
      <p className="mt-2 text-center font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-link">Bitinary Dev Console</p>
      <h1 className="mt-1 text-center text-h2">Sign in</h1>
      <p className="mt-1 text-center text-[15px] text-fg-2">Use the email and password for your developer account.</p>
      {notice && <p role="status" className="mt-4 rounded-[14px] bg-caution-bg px-3 py-2 text-[14px] font-semibold text-caution">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-[14px] bg-danger-bg px-3 py-2 text-[14px] font-semibold text-danger">{error}</p>}

      <form onSubmit={submitCredentials} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="dev-email" className="mb-1.5 block font-display text-[14px] font-medium">Email</label>
          <input id="dev-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className={field} placeholder="you@bitinary.ph" />
        </div>
        <div>
          <label htmlFor="dev-password" className="mb-1.5 block font-display text-[14px] font-medium">Password</label>
          <input id="dev-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
        </div>
        {turnstileSiteKey && (
          <Turnstile
            ref={captchaRef}
            siteKey={turnstileSiteKey}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken(undefined)}
            onError={() => setCaptchaToken(undefined)}
          />
        )}
        <Button type="submit" block size="lg" icon={<LogIn size={18} />} disabled={busy || (!!turnstileSiteKey && !captchaToken)}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/" className="min-h-11 content-center font-display text-[14px] font-medium text-fg-2">Back to the app</Link>
      </div>
    </Card>
  )
}
