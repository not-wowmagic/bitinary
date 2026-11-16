import { ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentDev } from '@/app/console'
import { useStore } from '@/app/store'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Badge, PageHead, Panel, field } from './ui'

type ConsoleAdmin = { email: string; created_at: string }

export function TeamPage() {
  const me = useCurrentDev()!
  const { showToast } = useStore()
  const [admins, setAdmins] = useState<ConsoleAdmin[]>([])
  const [email, setEmail] = useState('')
  const [removing, setRemoving] = useState<ConsoleAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const loadAdmins = useCallback(async () => {
    setLoading(true)
    const { data, error: queryError } = await supabase.from('dev_console_admins').select('email,created_at').order('created_at')
    if (queryError) {
      setError(`Couldn’t load developer access. Details: ${queryError.message}`)
      setLoading(false)
      return
    }
    setAdmins(data ?? [])
    setError(undefined)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadAdmins()
  }, [loadAdmins])

  const addAdmin = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    setError(undefined)
    const { error: insertError } = await supabase.from('dev_console_admins').insert({ email: normalizedEmail })
    if (insertError) {
      setError(insertError.code === '23505' ? 'This email already has developer access.' : `Couldn’t add access. Details: ${insertError.message}`)
      setBusy(false)
      return
    }
    setEmail('')
    await loadAdmins()
    setBusy(false)
    showToast({ text: 'Developer access added.', expression: 'celebrating' })
  }

  const removeAdmin = async (admin: ConsoleAdmin) => {
    if (admin.email === me.email.toLowerCase()) return
    setBusy(true)
    setError(undefined)
    const { error: deleteError } = await supabase.from('dev_console_admins').delete().eq('email', admin.email)
    if (deleteError) {
      setError(`Couldn’t remove access. Details: ${deleteError.message}`)
      setBusy(false)
      return
    }
    setRemoving(null)
    await loadAdmins()
    setBusy(false)
    showToast({ text: `Removed developer access for ${admin.email}.`, expression: 'pointing' })
  }

  return (
    <>
      <PageHead title="Team access" sub="Developer access is stored in Supabase. Passwords are managed only by Supabase Auth." />
      <div className="space-y-4">
        <Panel title="Your account" sub={me.email}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="shrink-0 text-ok" size={22} />
            <div>
              <p className="font-display font-semibold">{me.name}</p>
              <p className="text-[13px] text-fg-2">You’re signed in and have developer access.</p>
            </div>
          </div>
        </Panel>
        <Panel title="Authorized developers" sub={`${admins.length} developer${admins.length === 1 ? '' : 's'} with access`} pad={false}>
          {error && <p role="alert" className="m-4 rounded-xl bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          {loading ? (
            <p className="px-5 py-4 text-sm text-fg-2">Loading developer access…</p>
          ) : admins.length ? (
            <ul className="divide-y divide-line">
              {admins.map((admin) => (
                <li key={admin.email} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[14px] font-semibold">{admin.email}</p>
                    <p className="text-[12px] text-fg-2">Added {new Date(admin.created_at).toLocaleDateString()}</p>
                  </div>
                  {admin.email === me.email.toLowerCase() ? <Badge tone="orange">You</Badge> : (
                    <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} disabled={busy} onClick={() => setRemoving(admin)} aria-label={`Remove ${admin.email}`}>
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-fg-2">No developers have access yet.</p>
          )}
        </Panel>
        <Panel title="Add developer access">
          <p className="mb-3 text-[14px] text-fg-2">First create or invite the person under Supabase Dashboard → Authentication → Users. Then add their matching email here.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className={field} />
            <Button icon={<UserPlus size={17} />} disabled={busy || !email.trim()} onClick={() => void addAdmin()}>
              Add access
            </Button>
          </div>
        </Panel>
      </div>
      <IOSAlert
        open={!!removing}
        title={`Remove ${removing?.email ?? ''}?`}
        message="This email will no longer be able to access the developer console."
        actions={[
          { label: 'Cancel', onClick: () => setRemoving(null) },
          { label: 'Remove', destructive: true, bold: true, onClick: () => removing && void removeAdmin(removing) },
        ]}
      />
    </>
  )
}
