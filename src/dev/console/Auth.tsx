import { Check, Eye, EyeOff, LogIn, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { DEMO_DEV_EMAIL, useConsole, type DevAccount } from '@/app/console'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'
import { DEFAULT_DEV_PASSWORD, hashPassword, newSalt, passwordOk, passwordRules } from '@/lib/password'
import { mmss, useCountdown } from '@/lib/useCountdown'
import { field } from './ui'

const MAX_TRIES = 5

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5 py-10">
      <div className="card w-full max-w-[440px] p-6 md:p-8">{children}</div>
    </main>
  )
}

export function PasswordInput({ id, value, onChange, autoComplete, invalid, label }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean; label: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={invalid || undefined} className={cn(field, 'pr-12', invalid && 'border-danger')} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? `Hide ${label}` : `Show ${label}`} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-fg-2 hover:bg-sunken">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

export function SignIn({ notice }: { notice?: string }) {
  const { c, update } = useConsole()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState<{ field: 'email' | 'password'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)
  const key = email.trim().toLowerCase()
  const lock = c.devFails[key]
  const left = useCountdown(lock?.until ?? 0)
  const demo = c.devAccounts.find((a) => a.email === DEMO_DEV_EMAIL && a.mustChange && a.active)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!key) return setError({ field: 'email', text: 'Enter your email.' })
    if (left) return
    const acc = c.devAccounts.find((a) => a.email === key)
    if (!acc) return setError({ field: 'email', text: 'No developer account with that email.' })
    if (!acc.active) return setError({ field: 'email', text: 'This account is turned off. Ask a teammate to turn it back on.' })
    if (!pw) return setError({ field: 'password', text: 'Enter your password.' })
    setBusy(true)
    const ok = (await hashPassword(acc.salt, pw)) === acc.hash
    setBusy(false)
    if (!ok) {
      const count = (lock?.count ?? 0) + 1
      const locked = count >= MAX_TRIES
      update((x) => ({ ...x, devFails: { ...x.devFails, [key]: { count: locked ? 0 : count, until: locked ? Date.now() + 60_000 : 0 } } }), locked ? { area: 'Access', action: `Locked ${key} after ${MAX_TRIES} wrong passwords` } : undefined)
      setPw('')
      return setError({ field: 'password', text: locked ? 'Too many attempts.' : `Wrong password. ${MAX_TRIES - count} ${MAX_TRIES - count === 1 ? 'try' : 'tries'} left.` })
    }
    const now = Date.now()
    update((x) => {
      const { [key]: _drop, ...fails } = x.devFails
      return { ...x, devFails: fails, devSession: { accountId: acc.id, at: now, lastActive: now }, devAccounts: x.devAccounts.map((a) => (a.id === acc.id ? { ...a, lastSignIn: new Date(now).toISOString() } : a)) }
    })
    // Log after the session exists so the entry carries the developer's name.
    setTimeout(() => update((x) => x, { area: 'Access', action: 'Signed in' }), 0)
  }

  return (
    <Card>
      <Jimbot expression="pointing" variant="standalone" size={110} className="mx-auto" />
      <p className="mt-2 text-center font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-link">Bitinary Dev Console</p>
      <h1 className="mt-1 text-center text-h2">Sign in</h1>
      <p className="mt-1 text-center text-[15px] text-fg-2">Sign in with your developer account.</p>
      {notice && <p role="status" className="mt-4 rounded-[14px] bg-caution-bg px-3 py-2 text-[14px] font-semibold text-caution">{notice}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="dev-email" className="mb-1.5 block font-display text-[14px] font-medium">
            Email
          </label>
          <input id="dev-email" type="email" autoComplete="username" value={email} onChange={(e) => (setEmail(e.target.value), setError(null))} aria-invalid={error?.field === 'email' || undefined} className={cn(field, error?.field === 'email' && 'border-danger')} placeholder="you@bitinary.ph" />
          {error?.field === 'email' && <p className="mt-1 text-[13px] font-semibold text-danger">{error.text}</p>}
        </div>
        <div>
          <label htmlFor="dev-pw" className="mb-1.5 block font-display text-[14px] font-medium">
            Password
          </label>
          <PasswordInput id="dev-pw" label="password" value={pw} onChange={(v) => (setPw(v), setError(null))} autoComplete="current-password" invalid={error?.field === 'password'} />
          {left > 0 ? <p className="mt-1 text-[13px] font-semibold text-danger">Too many attempts. Try again in {mmss(left)}.</p> : error?.field === 'password' && <p className="mt-1 text-[13px] font-semibold text-danger">{error.text}</p>}
        </div>
        <Button type="submit" block size="lg" icon={<LogIn size={18} />} disabled={busy || left > 0}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setForgot(true)} className="min-h-11 font-display text-[14px] font-medium text-link">
          Forgot password?
        </button>
        <Link to="/" className="min-h-11 content-center font-display text-[14px] font-medium text-fg-2">
          Back to the app
        </Link>
      </div>
      {demo && (
        <p className="mt-3 rounded-[14px] bg-sunken px-3 py-2 text-[13px] text-fg-2 dark:bg-elevated">
          Demo account: <b className="text-fg">{DEMO_DEV_EMAIL}</b> · <b className="text-fg">{DEFAULT_DEV_PASSWORD}</b>
        </p>
      )}
      <Sheet open={forgot} onClose={() => setForgot(false)} title="Forgot your password?">
        <p className="text-body text-fg-2">Ask a teammate to reset it in the console under Team. They'll give you a temporary password. There's no email on this prototype.</p>
      </Sheet>
    </Card>
  )
}

export function RulesList({ pw }: { pw: string }) {
  return (
    <ul className="space-y-1">
      {passwordRules(pw).map((r) => (
        <li key={r.label} className={cn('flex items-center gap-2 text-[13px]', r.ok ? 'text-ok' : 'text-fg-2')}>
          {r.ok ? <Check size={14} strokeWidth={3} /> : <X size={14} />} {r.label}
        </li>
      ))}
    </ul>
  )
}

/** Hash and store a new password for an account. */
export async function withPassword(a: DevAccount, pw: string, mustChange: boolean): Promise<DevAccount> {
  const salt = newSalt()
  return { ...a, salt, hash: await hashPassword(salt, pw), mustChange }
}

export function SetPassword({ account }: { account: DevAccount }) {
  const { update } = useConsole()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const mismatch = confirm.length > 0 && confirm !== pw
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!passwordOk(pw) || pw !== confirm) return
    setBusy(true)
    const next = await withPassword(account, pw, false)
    update((x) => ({ ...x, devAccounts: x.devAccounts.map((a) => (a.id === account.id ? next : a)) }), { area: 'Access', action: 'Set a new password' })
  }
  return (
    <Card>
      <Jimbot expression="waving" variant="standalone" size={100} className="mx-auto" />
      <h1 className="mt-2 text-center text-h2">Set a new password</h1>
      <p className="mt-1 text-center text-[15px] text-fg-2">Hi {account.name.split(' ')[0]}, choose your own password to finish signing in.</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="new-pw" className="mb-1.5 block font-display text-[14px] font-medium">
            New password
          </label>
          <PasswordInput id="new-pw" label="new password" value={pw} onChange={setPw} autoComplete="new-password" invalid={tried && !passwordOk(pw)} />
          <div className="mt-2">
            <RulesList pw={pw} />
          </div>
        </div>
        <div>
          <label htmlFor="confirm-pw" className="mb-1.5 block font-display text-[14px] font-medium">
            Confirm password
          </label>
          <PasswordInput id="confirm-pw" label="confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" invalid={(tried || mismatch) && confirm !== pw} />
          {(tried || mismatch) && confirm !== pw && <p className="mt-1 text-[13px] font-semibold text-danger">The passwords don't match.</p>}
        </div>
        <Button type="submit" block size="lg" disabled={busy}>
          {busy ? 'Saving…' : 'Save and continue'}
        </Button>
      </form>
      <button onClick={() => update((x) => ({ ...x, devSession: null }))} className="mt-3 min-h-11 w-full font-display text-[14px] font-medium text-fg-2">
        Use a different account
      </button>
    </Card>
  )
}
