import { Copy, KeyRound, Plus, Power, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useConsole, useCurrentDev, type DevAccount } from '@/app/console'
import { useStore } from '@/app/store'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'
import { hashPassword, passwordOk, tempPassword } from '@/lib/password'
import { PasswordInput, RulesList, withPassword } from './Auth'
import { fmtDate, fmtRel } from './data'
import { Avatar, Badge, Field, PageHead, Panel, field } from './ui'

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

/** One-time display of a temporary password with a copy button. */
function TempShown({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${email}\n${password}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Sheet open onClose={onClose} title="Temporary password" footer={<Button block size="lg" onClick={onClose}>Done</Button>}>
      <p className="text-[15px] text-fg-2">Share this privately. It's shown only once. They'll set their own password on first sign-in.</p>
      <div className="mt-4 rounded-[16px] bg-sunken p-4 dark:bg-elevated">
        <p className="text-[13px] text-fg-2">Email</p>
        <p className="font-display text-[16px] font-semibold">{email}</p>
        <p className="mt-2 text-[13px] text-fg-2">Temporary password</p>
        <p className="font-mono text-[20px] font-semibold tracking-wide">{password}</p>
      </div>
      <Button variant="secondary" className="mt-3" icon={<Copy size={16} />} onClick={copy}>
        {copied ? 'Copied' : 'Copy email and password'}
      </Button>
    </Sheet>
  )
}

function AddDeveloper({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (email: string, pw: string) => void }) {
  const { c, update } = useConsole()
  const me = useCurrentDev()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState(() => tempPassword())
  const [tried, setTried] = useState(false)
  useEffect(() => {
    if (open) {
      setName('')
      setEmail('')
      setPw(tempPassword())
      setTried(false)
    }
  }, [open])
  const key = email.trim().toLowerCase()
  const errors = {
    name: name.trim().length < 2 ? 'Enter their name.' : '',
    email: !validEmail(key) ? 'Enter a valid email.' : c.devAccounts.some((a) => a.email === key) ? 'There is already a developer with this email.' : '',
    pw: passwordOk(pw) ? '' : 'The temporary password must follow the rules.',
  }
  const save = async () => {
    setTried(true)
    if (errors.name || errors.email || errors.pw) return
    const base: DevAccount = { id: `dev-${Date.now()}`, name: name.trim(), email: key, salt: '', hash: '', mustChange: true, active: true, createdAt: new Date().toISOString(), createdBy: me?.id }
    const acc = await withPassword(base, pw, true)
    update((x) => ({ ...x, devAccounts: [...x.devAccounts, acc] }), { area: 'Team', action: `Added developer ${acc.name} (${acc.email})` })
    onClose()
    onAdded(acc.email, pw)
  }
  return (
    <Sheet open={open} onClose={onClose} title="Add a developer" footer={<Button block size="lg" icon={<Plus size={18} />} onClick={save}>Add developer</Button>}>
      <div className="space-y-4">
        <Field label="Name" htmlFor="nd-name" error={tried ? errors.name : undefined}>
          <input id="nd-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan dela Cruz" className={cn(field, tried && errors.name && 'border-danger')} />
        </Field>
        <Field label="Email" htmlFor="nd-email" error={tried ? errors.email : undefined}>
          <input id="nd-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@bitinary.ph" className={cn(field, tried && errors.email && 'border-danger')} />
        </Field>
        <Field label="Temporary password" htmlFor="nd-pw" error={tried ? errors.pw : undefined}>
          <div className="flex gap-2">
            <input id="nd-pw" value={pw} onChange={(e) => setPw(e.target.value)} className={cn(field, 'font-mono')} />
            <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => setPw(tempPassword())}>
              Generate
            </Button>
          </div>
          <div className="mt-2">
            <RulesList pw={pw} />
          </div>
        </Field>
      </div>
    </Sheet>
  )
}

function MyAccount({ me }: { me: DevAccount }) {
  const { update } = useConsole()
  const { showToast } = useStore()
  const [name, setName] = useState(me.name)
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => setName(me.name), [me.name])
  const saveName = () => {
    if (name.trim().length < 2) return
    update((x) => ({ ...x, devAccounts: x.devAccounts.map((a) => (a.id === me.id ? { ...a, name: name.trim() } : a)) }), { area: 'Team', action: `Renamed own account to ${name.trim()}` })
    showToast({ text: 'Name saved', expression: 'celebrating' })
  }
  const changePw = async () => {
    setErr(null)
    if ((await hashPassword(me.salt, cur)) !== me.hash) return setErr('Your current password is wrong.')
    if (!passwordOk(pw)) return setErr('The new password must follow the rules.')
    if (pw !== confirm) return setErr("The new passwords don't match.")
    setBusy(true)
    const next = await withPassword(me, pw, false)
    update((x) => ({ ...x, devAccounts: x.devAccounts.map((a) => (a.id === me.id ? next : a)) }), { area: 'Team', action: 'Changed own password' })
    setBusy(false)
    setCur('')
    setPw('')
    setConfirm('')
    showToast({ text: 'Password changed', expression: 'celebrating' })
  }
  return (
    <Panel title="My account" sub={me.email}>
      <div id="me" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Display name" htmlFor="me-name" hint="Shown in the activity log and on verification reviews">
            <input id="me-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </Field>
          <Button variant="secondary" icon={<Save size={16} />} disabled={name.trim() === me.name || name.trim().length < 2} onClick={saveName}>
            Save name
          </Button>
        </div>
        <div className="space-y-3">
          <Field label="Current password" htmlFor="me-cur">
            <PasswordInput id="me-cur" label="current password" value={cur} onChange={setCur} autoComplete="current-password" />
          </Field>
          <Field label="New password" htmlFor="me-new">
            <PasswordInput id="me-new" label="new password" value={pw} onChange={setPw} autoComplete="new-password" />
          </Field>
          <RulesList pw={pw} />
          <Field label="Confirm new password" htmlFor="me-confirm">
            <PasswordInput id="me-confirm" label="confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </Field>
          {err && <p className="text-[13px] font-semibold text-danger">{err}</p>}
          <Button icon={<KeyRound size={16} />} disabled={busy || !cur || !pw} onClick={changePw}>
            {busy ? 'Saving…' : 'Change password'}
          </Button>
        </div>
      </div>
    </Panel>
  )
}

export function TeamPage() {
  const { c, update } = useConsole()
  const me = useCurrentDev()!
  const { showToast } = useStore()
  const [adding, setAdding] = useState(false)
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null)
  const [remove, setRemove] = useState<DevAccount | null>(null)
  const activeCount = c.devAccounts.filter((a) => a.active).length
  const nameOf = (id?: string) => c.devAccounts.find((a) => a.id === id)?.name
  const blockReason = (a: DevAccount) => (a.id === me.id ? "You can't do this to your own account." : a.active && activeCount <= 1 ? 'This is the last active account.' : null)

  useEffect(() => {
    if (location.hash === '#me') document.getElementById('me')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const reset = async (a: DevAccount) => {
    const pw = tempPassword()
    const next = await withPassword(a, pw, true)
    update((x) => ({ ...x, devAccounts: x.devAccounts.map((y) => (y.id === a.id ? next : y)) }), { area: 'Team', action: `Reset the password of ${a.name}` })
    setShown({ email: a.email, password: pw })
  }
  const toggle = (a: DevAccount) => {
    update((x) => ({ ...x, devAccounts: x.devAccounts.map((y) => (y.id === a.id ? { ...y, active: !y.active } : y)) }), { area: 'Team', action: `${a.active ? 'Turned off' : 'Turned on'} ${a.name}` })
    showToast({ text: a.active ? `${a.name} can no longer sign in` : `${a.name} can sign in again`, expression: 'pointing' })
  }
  const doRemove = (a: DevAccount) => {
    update((x) => ({ ...x, devAccounts: x.devAccounts.filter((y) => y.id !== a.id) }), { area: 'Team', action: `Removed developer ${a.name} (${a.email})` })
    showToast({ text: `Removed ${a.name}`, expression: 'unsure' })
  }

  return (
    <>
      <PageHead
        title="Team"
        sub={`${c.devAccounts.length} developer accounts · everyone can use every tool`}
        actions={
          <Button icon={<Plus size={18} />} onClick={() => setAdding(true)}>
            Add developer
          </Button>
        }
      />
      <Panel pad={false}>
        <ul className="divide-y divide-line">
          {c.devAccounts.map((a) => {
            const why = blockReason(a)
            return (
              <li key={a.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 md:px-5', !a.active && 'opacity-60')}>
                <Avatar name={a.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 font-display text-[15px] font-semibold">
                    {a.name}
                    {a.id === me.id && <Badge tone="orange">You</Badge>}
                    {!a.active ? <Badge tone="danger">Off</Badge> : a.mustChange ? <Badge tone="caution">Must set password</Badge> : <Badge tone="ok">Active</Badge>}
                  </p>
                  <p className="truncate text-[13px] text-fg-2">
                    {a.email} · last sign-in {a.lastSignIn ? fmtRel(a.lastSignIn) : 'never'} · added {fmtDate(a.createdAt)}
                    {nameOf(a.createdBy) ? ` by ${nameOf(a.createdBy)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2" title={why ?? undefined}>
                  <Button size="sm" variant="secondary" icon={<KeyRound size={15} />} disabled={!!why && a.id === me.id} onClick={() => reset(a)}>
                    Reset password
                  </Button>
                  <Button size="sm" variant="secondary" icon={<Power size={15} />} disabled={!!why} onClick={() => toggle(a)}>
                    {a.active ? 'Turn off' : 'Turn on'}
                  </Button>
                  <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} disabled={!!why} onClick={() => setRemove(a)} aria-label={`Remove ${a.name}`}>
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
        <p className="border-t border-line px-4 py-3 text-[13px] text-fg-2 md:px-5">You can't turn off or remove your own account or the last active one. Change your own password under My account.</p>
      </Panel>
      <div className="mt-4">
        <MyAccount me={me} />
      </div>
      <AddDeveloper open={adding} onClose={() => setAdding(false)} onAdded={(email, password) => setShown({ email, password })} />
      {shown && <TempShown email={shown.email} password={shown.password} onClose={() => setShown(null)} />}
      <IOSAlert
        open={!!remove}
        title={`Remove ${remove?.name}?`}
        message="They won't be able to sign in. Their name stays on past activity."
        actions={[
          { label: 'Cancel', onClick: () => setRemove(null) },
          { label: 'Remove', destructive: true, bold: true, onClick: () => (remove && doRemove(remove), setRemove(null)) },
        ]}
      />
    </>
  )
}
