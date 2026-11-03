import {
  ArrowLeft, Bell, Check, CalendarCheck, ChevronDown, CreditCard, Download, Globe, HelpCircle, KeyRound, Laptop, Link2, LogOut, Mail, MessageCircle, Moon, Phone, QrCode, Rocket, Shield, Smartphone, Store, Tag, Trash2, User, Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTheme, type ThemeMode } from '@/app/theme'
import { GoogleLogo, inputBase } from '@/components/flow/Fields'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { formatPH } from '@/screens/signup/Signup'
import { longDate } from '../format'
import type { Staff } from '../seed'
import { useBiz, type Channel, type LangPref } from '../store'
import { Avatar, Card, Group, GroupRow, PageHeader, Pill } from '../ui'

export function SubPage({ title, children, phase, actions }: { title: string; children: ReactNode; phase?: 'MVP' | 'P2' | 'P3'; actions?: ReactNode }) {
  const { t } = useBiz()
  const navigate = useNavigate()
  return (
    <main>
      <div className="px-4 pt-4 md:px-8">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/biz/account')}>
          Account
        </Button>
      </div>
      <PageHeader className="pt-1 md:pt-2" title={title} phase={phase} actions={actions} />
      <div className="max-w-[980px] space-y-4 px-4 md:px-8">{children}</div>
      <span className="sr-only">{t('Account', 'Account')}</span>
    </main>
  )
}

export function AccountHome() {
  const { d, t, lang, reset, set, status, verified } = useBiz()
  const navigate = useNavigate()
  const [out, setOut] = useState(false)
  return (
    <main>
      <PageHeader title="Account" phase="MVP" />
      <div className="max-w-[860px] space-y-6 px-4 md:px-8">
        <section className="flex items-center gap-4 rounded-[24px] bg-brown p-4 text-cream dark:bg-elevated">
          <Avatar name={d.profile.name || 'B'} size={64} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] font-semibold leading-tight">{d.profile.name}</p>
            <p className="text-[15px] text-[#E8CDB9]">
              Owner · {d.business.name}
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/biz/account/profile')}>
            {t('I-edit', 'Edit')}
          </Button>
        </section>
        <Group title={t('Account', 'Account')}>
          <GroupRow icon={<User size={19} />} color="#FF6A00" label="Profile" sub={t('Pangalan, email, mobile, password, device', 'Name, email, mobile, password, devices')} to="/biz/account/profile" />
        </Group>
        <Group title={t('Negosyo', 'Business')}>
          <GroupRow icon={<Store size={19} />} color="#6B3A22" label={t('Impormasyon ng Negosyo', 'Backgrounds')} sub={t('Basics, lokasyon, oras, menu, permit', 'Basics, location, hours, menu, permits')} to="/biz/stats/backgrounds" />
          <GroupRow icon={<Users size={19} />} color="#0B7F96" label={t('Branch, staff at pahintulot', 'Branches, staff and permissions')} value={`${d.staff.length}`} to="/biz/account/team" />
          <GroupRow icon={<QrCode size={19} />} color="#3A1A0E" label={t('QR Check-in kit', 'QR Check-in kit')} to="/biz/account/qr" />
        </Group>
        <Group title={t('Paglago at bayad', 'Growth and billing')}>
          <GroupRow icon={<Tag size={19} />} color="#C84A00" label="Deals" value={!verified ? <Pill>{t('Naka-lock', 'Locked')}</Pill> : `${d.deals.length}`} to="/biz/account/deals" />
          <GroupRow icon={<Rocket size={19} />} color="#B26A00" label={t('Mga boost', 'Boosts')} value={!verified ? <Pill>{t('Naka-lock', 'Locked')}</Pill> : undefined} to="/biz/account/boost" />
          <GroupRow icon={<CalendarCheck size={19} />} color="#1B8A3A" label={t('Reservation at pila', 'Reservations and queue')} value={!verified ? <Pill>{t('Naka-lock', 'Locked')}</Pill> : `${d.requests.filter((r) => r.status === 'new').length} ${t('bago', 'new')}`} to="/biz/account/reservations" />
          <GroupRow icon={<CreditCard size={19} />} color="#5B3CC4" label={t('Plan at bayad', 'Plan and billing')} value="Free" to="/biz/account/billing" />
        </Group>
        <Group title={t('App', 'App')}>
          <GroupRow icon={<Globe size={19} />} color="#0B7F96" label={t('Mga Preference', 'Preferences')} sub={t('Wika, itsura, notification, privacy', 'Language, appearance, notifications, privacy')} value={lang === 'en' ? 'English' : 'Tagalog'} to="/biz/account/preferences" />
          <GroupRow icon={<HelpCircle size={19} />} color="#C84A00" label={t('Tulong at suporta', 'Help and support')} to="/biz/account/help" />
          <GroupRow icon={<LogOut size={19} />} color="#D32F2F" label={t('Mag-sign out', 'Sign out')} danger onClick={() => setOut(true)} />
        </Group>
        <p className="text-center text-[13px] text-fg-2">
          Bitinary Business · {status} ·{' '}
          <button className="underline" onClick={() => (reset(), navigate('/biz/welcome'))}>
            {t('I-reset ang demo', 'Reset demo')}
          </button>
        </p>
      </div>
      <IOSAlert
        open={out}
        title={t('Mag-sign out?', 'Sign out?')}
        actions={[
          { label: t('Kanselahin', 'Cancel'), onClick: () => setOut(false) },
          { label: t('Mag-sign out', 'Sign out'), destructive: true, bold: true, onClick: () => (set((x) => ({ ...x, session: null })), navigate('/biz/welcome')) },
        ]}
      />
    </main>
  )
}

export function ProfilePage() {
  const { d, set, t, lang, showToast } = useBiz()
  const [p, setP] = useState(d.profile)
  const [pw, setPw] = useState(false)
  const devices = [
    { icon: <Laptop size={20} />, name: 'Chrome · Windows', where: 'Ermita, Maynila', now: true },
    { icon: <Smartphone size={20} />, name: 'Bitinary Business · iPhone', where: 'Ermita, Maynila' },
    { icon: <Smartphone size={20} />, name: 'Chrome · Android', where: 'Quezon City' },
  ]
  const [devs, setDevs] = useState(devices)
  return (
    <SubPage title="Profile" phase="MVP">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ['name', t('Pangalan ng owner', 'Owner name')],
              ['nickname', t('Palayaw', 'Nickname')],
              ['email', 'Email'],
              ['mobile', 'Mobile (+63)'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="block">
              <span className="mb-1.5 block font-display text-[14px] font-medium">{l}</span>
              <input value={k === 'mobile' ? formatPH(p.mobile) : p[k]} onChange={(e) => setP({ ...p, [k]: k === 'mobile' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value })} className={cn(inputBase, 'border-line')} />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={JSON.stringify(p) === JSON.stringify(d.profile)} onClick={() => (set((x) => ({ ...x, profile: p })), showToast({ text: t('Na-save!', 'Saved!') }))}>
            {t('I-save', 'Save')}
          </Button>
        </div>
      </Card>
      <Group>
        <GroupRow icon={<GoogleLogo size={18} />} color="#FFFFFF" label="Google" sub={d.profile.google ? d.profile.google : t('Hindi pa konektado', 'Not connected')} trailing={<Button size="sm" variant="secondary" onClick={() => set((x) => ({ ...x, profile: { ...x.profile, google: x.profile.google ? undefined : 'ben.dizon@gmail.com' } }))}>{d.profile.google ? t('Idiskonekta', 'Disconnect') : t('Ikonekta', 'Connect')}</Button>} />
        <GroupRow icon={<KeyRound size={19} />} color="#6B3A22" label={t('Palitan ang password', 'Change password')} onClick={() => setPw(true)} />
      </Group>
      <Card title={t('Mga aktibong device', 'Active devices')} icon={<Shield size={20} />}>
        <ul className="divide-y divide-line">
          {devs.map((x) => (
            <li key={x.name} className="flex min-h-14 items-center gap-3 py-2">
              <span className="text-link">{x.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px]">{x.name}</span>
                <span className="text-[14px] text-fg-2">
                  {x.where} · {x.now ? t('Ito ang device na ito', 'This device') : longDate(Date.now() - 2 * 864e5, lang)}
                </span>
              </span>
              {!x.now && (
                <Button size="sm" variant="danger" onClick={() => setDevs(devs.filter((y) => y !== x))}>
                  {t('I-sign out', 'Sign out')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Sheet open={pw} onClose={() => setPw(false)} title={t('Palitan ang password', 'Change password')}>
        <div className="space-y-3">
          {[t('Kasalukuyang password', 'Current password'), t('Bagong password', 'New password'), t('Ulitin ang bagong password', 'Repeat new password')].map((l) => (
            <label key={l} className="block">
              <span className="mb-1.5 block font-display text-[14px] font-medium">{l}</span>
              <input type="password" className={cn(inputBase, 'border-line')} />
            </label>
          ))}
          <Button block size="lg" onClick={() => (setPw(false), showToast({ text: t('Napalitan ang password', 'Password changed') }))}>
            {t('I-save', 'Save')}
          </Button>
        </div>
      </Sheet>
    </SubPage>
  )
}

const roleLabel = (r: Staff['role']) => (r === 'owner' ? 'Owner' : r === 'manager' ? 'Manager' : 'Staff')

export function TeamPage() {
  const { d, set, t, showToast } = useBiz()
  const [invite, setInvite] = useState(false)
  const [role, setRole] = useState<Staff['role']>('staff')
  const [branchSheet, setBranchSheet] = useState(false)
  const [bn, setBn] = useState({ name: '', area: '' })
  const link = `https://biz.bitinary.ph/join/${d.qrToken.toLowerCase()}-${role}`
  const perms: [string, boolean, boolean, boolean][] = [
    [t('Mabilis na Update', 'Quick Update'), true, true, true],
    [t('Posts at sagot', 'Posts and replies'), true, true, false],
    [t('Impormasyon ng Negosyo', 'Backgrounds'), true, true, false],
    [t('Deals at boosts', 'Deals and boosts'), true, true, false],
    [t('Bayad at permit', 'Billing and permits'), true, false, false],
    [t('Staff at branch', 'Staff and branches'), true, false, false],
  ]
  return (
    <SubPage title={t('Branch, staff at pahintulot', 'Branches, staff and permissions')} phase="MVP">
      <Card title={t('Mga branch', 'Branches')} phase="P3" action={<Button size="sm" variant="secondary" onClick={() => setBranchSheet(true)}>{t('Magdagdag', 'Add')}</Button>}>
        <ul className="divide-y divide-line">
          {d.branches.map((b) => (
            <li key={b.id} className="flex min-h-14 items-center gap-3">
              <Store size={20} className="text-link" />
              <span className="flex-1">
                <span className="block font-display text-[16px] font-semibold">{b.name}</span>
                <span className="text-[14px] text-fg-2">{b.area}</span>
              </span>
              {d.activeBranch === b.id && <Pill tone="orange">{t('Aktibo', 'Active')}</Pill>}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Staff" icon={<Users size={20} />} action={<Button size="sm" icon={<Link2 size={16} />} onClick={() => setInvite(true)}>{t('Mag-imbita', 'Invite')}</Button>}>
        <ul className="divide-y divide-line">
          {d.staff.map((s) => (
            <li key={s.id} className="flex min-h-16 flex-wrap items-center gap-3 py-2">
              <Avatar name={s.name} />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">{s.name}</span>
                <span className="text-[14px] text-fg-2">
                  {s.email} · {d.branches.find((b) => b.id === s.branch)?.name}
                </span>
              </span>
              {s.status === 'invited' && <Pill tone="caution">{t('Inimbitahan', 'Invited')}</Pill>}
              {s.role === 'owner' ? (
                <Pill tone="orange">Owner</Pill>
              ) : (
                <label className="relative">
                  <span className="sr-only">Role</span>
                  <select value={s.role} onChange={(e) => set((x) => ({ ...x, staff: x.staff.map((y) => (y.id === s.id ? { ...y, role: e.target.value as Staff['role'] } : y)) }))} className="h-11 appearance-none rounded-full border border-line bg-bg pl-4 pr-9 font-display text-[14px] font-medium">
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </label>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card title={t('Mga pahintulot', 'Permissions')} icon={<Shield size={20} />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-fg-2">
                <th className="py-2 font-medium" />
                {(['owner', 'manager', 'staff'] as const).map((r) => (
                  <th key={r} className="py-2 text-center font-medium">
                    {roleLabel(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map(([l, a, b, c]) => (
                <tr key={l} className="border-b border-line last:border-0">
                  <td className="py-2.5">{l}</td>
                  {[a, b, c].map((v, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {v ? <Check size={18} className="mx-auto text-ok" aria-label={t('Oo', 'Yes')} /> : <span className="text-fg-2">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Sheet open={invite} onClose={() => setInvite(false)} title={t('Mag-imbita sa pamamagitan ng link', 'Invite by link')}>
        <p className="mb-2 font-display text-[14px] font-medium">Role</p>
        <Segmented<Staff['role']>
          className="w-full"
          value={role}
          onChange={setRole}
          options={[
            { value: 'manager', label: 'Manager' },
            { value: 'staff', label: 'Staff' },
          ]}
        />
        <p className="mt-4 break-all rounded-[14px] bg-sunken p-3 font-mono text-[14px] dark:bg-elevated">{link}</p>
        <p className="mt-2 text-[14px] text-fg-2">{t('Mag-e-expire ang link sa loob ng 7 araw.', 'The link expires in 7 days.')}</p>
        <Button block size="lg" className="mt-4" icon={<Link2 size={18} />} onClick={() => (navigator.clipboard?.writeText(link).catch(() => {}), setInvite(false), showToast({ text: t('Nakopya ang link', 'Link copied') }))}>
          {t('Kopyahin ang link', 'Copy link')}
        </Button>
      </Sheet>
      <Sheet open={branchSheet} onClose={() => setBranchSheet(false)} title={t('Bagong branch', 'New branch')}>
        <div className="space-y-3">
          <input value={bn.name} onChange={(e) => setBn({ ...bn, name: e.target.value })} placeholder={t('Pangalan ng branch', 'Branch name')} aria-label={t('Pangalan ng branch', 'Branch name')} className={cn(inputBase, 'border-line')} />
          <input value={bn.area} onChange={(e) => setBn({ ...bn, area: e.target.value })} placeholder={t('Lungsod', 'City')} aria-label={t('Lungsod', 'City')} className={cn(inputBase, 'border-line')} />
          <Button block size="lg" disabled={!bn.name.trim()} onClick={() => (set((x) => ({ ...x, branches: [...x.branches, { id: `br${Date.now()}`, name: bn.name.trim(), area: bn.area.trim() }] })), setBranchSheet(false), setBn({ name: '', area: '' }))}>
            {t('Idagdag', 'Add')}
          </Button>
        </div>
      </Sheet>
    </SubPage>
  )
}

export function BillingPage() {
  const { t, lang, showToast } = useBiz()
  const [plan, setPlan] = useState<'free' | 'plus'>('free')
  const invoices = [
    { id: 'INV-2026-0012', amount: 500, what: t('Boost: Reel ng kare-kare', 'Boost: kare-kare reel'), at: Date.now() - 9 * 864e5 },
    { id: 'INV-2026-0007', amount: 300, what: t('Boost: Halo-halo post', 'Boost: Halo-halo post'), at: Date.now() - 32 * 864e5 },
  ]
  return (
    <SubPage title={t('Plan at bayad', 'Plan and billing')} phase="P2">
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            ['free', 'Free', '₱0', [t('Profile, Quick Update, posts', 'Profile, Quick Update, posts'), t('Basic stats', 'Basic stats')]],
            ['plus', 'Plus', '₱499', [t('Analitika at lingguhang report', 'Analytics and weekly report'), t('Hanggang 3 branch', 'Up to 3 branches'), t('Priority na suporta', 'Priority support')]],
          ] as const
        ).map(([k, n, p, feats]) => (
          <button key={k} onClick={() => setPlan(k)} aria-pressed={plan === k} className={cn('rounded-[20px] border-2 bg-surface p-5 text-left shadow-card', plan === k ? 'border-primary' : 'border-transparent')}>
            <p className="font-display text-[20px] font-bold">{n}</p>
            <p className="font-display text-[28px] font-bold">
              {p}
              <span className="text-[15px] font-medium text-fg-2">/{t('buwan', 'month')}</span>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-fg-2">
              {feats.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <Card title={t('Paraan ng pagbayad', 'Payment methods')} icon={<CreditCard size={20} />}>
        <ul className="divide-y divide-line">
          {[
            ['GCash', '0917 ••• 4500', true],
            ['Maya', t('Hindi pa naka-link', 'Not linked'), false],
            ['Visa', '•••• 4242', false],
          ].map(([n, s, def]) => (
            <li key={n as string} className="flex min-h-14 items-center gap-3">
              <span className="flex h-10 w-14 items-center justify-center rounded-[10px] bg-sunken font-display text-[13px] font-bold dark:bg-elevated">{n as string}</span>
              <span className="flex-1 text-[15px] text-fg-2">{s as string}</span>
              {def && <Pill tone="ok">Default</Pill>}
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-3" onClick={() => showToast({ text: t('Idagdag ang paraan ng pagbayad', 'Add a payment method'), expression: 'pointing' })}>
          {t('Magdagdag', 'Add method')}
        </Button>
      </Card>
      <Card title={t('Mga invoice', 'Invoices')}>
        <table className="w-full text-left text-[15px]">
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <td className="py-3">
                  <span className="block font-semibold">{i.what}</span>
                  <span className="text-[13px] text-fg-2">
                    {i.id} · {longDate(i.at, lang)}
                  </span>
                </td>
                <td className="py-3 text-right font-display font-semibold">₱{i.amount}</td>
                <td className="py-3 text-right">
                  <Button size="sm" variant="ghost" aria-label={t('I-download', 'Download')} icon={<Download size={16} />}>
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </SubPage>
  )
}

export function PreferencesPage() {
  const { d, set, t, setLangPref, showToast } = useBiz()
  const { mode, setMode } = useTheme()
  const [del, setDel] = useState(false)
  const notif = d.prefs.notif
  const n = (k: keyof typeof notif, v: boolean) => set((x) => ({ ...x, prefs: { ...x.prefs, notif: { ...x.prefs.notif, [k]: v } } }))
  return (
    <SubPage title={t('Mga Preference', 'Preferences')} phase="MVP">
      <Card title={t('Wika', 'Language')} icon={<Globe size={20} />}>
        <Segmented<LangPref>
          className="w-full"
          label={t('Wika', 'Language')}
          value={d.langPref ?? 'en'}
          onChange={setLangPref}
          options={[
            { value: 'en', label: 'English' },
            { value: 'tl', label: 'Tagalog' },
            { value: 'device', label: t('Sundin ang device', 'Follow device') },
          ]}
        />
        <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-sunken p-3 dark:bg-elevated">
          <span className="flex-1 text-[15px]">{t('Jimbot: sundin ang tina-type ko (Taglish)', 'Jimbot: match what I type (Taglish)')}</span>
          <Toggle label="Jimbot" checked={d.prefs.jimbotMatch} onChange={(v) => set((x) => ({ ...x, prefs: { ...x.prefs, jimbotMatch: v } }))} />
        </div>
      </Card>
      <Card title={t('Itsura', 'Appearance')} icon={<Moon size={20} />}>
        <Segmented<ThemeMode>
          className="w-full"
          label={t('Itsura', 'Appearance')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </Card>
      <Card title="Notifications" icon={<Bell size={20} />}>
        <ul className="divide-y divide-line">
          {(
            [
              ['reviews', t('Bagong review', 'New reviews')],
              ['comments', t('Bagong komento', 'New comments')],
              ['reports', t('Update sa report', 'Report updates')],
              ['weekly', t('Lingguhang report', 'Weekly report')],
              ['deals', t('Deal at redemption', 'Deals and redemptions')],
            ] as const
          ).map(([k, l]) => (
            <li key={k} className="flex min-h-14 items-center justify-between gap-3">
              <span className="text-[16px]">{l}</span>
              <Toggle label={l} checked={notif[k]} onChange={(v) => n(k, v)} />
            </li>
          ))}
        </ul>
        <p className="mb-2 mt-4 font-display text-[14px] font-medium">{t('Saan ipapadala ang report', 'Report delivery channel')}</p>
        <Segmented<Channel>
          className="w-full"
          value={d.prefs.channel}
          onChange={(c) => set((x) => ({ ...x, prefs: { ...x.prefs, channel: c } }))}
          options={[
            { value: 'notif', label: 'Notification' },
            { value: 'messenger', label: 'Messenger' },
            { value: 'sms', label: 'SMS' },
          ]}
        />
      </Card>
      <Card title={t('Data at privacy', 'Data and privacy')} icon={<Shield size={20} />}>
        <p className="text-[15px] text-fg-2">{t('Sumusunod kami sa Data Privacy Act of 2012 (RA 10173).', 'We follow the Data Privacy Act of 2012 (RA 10173).')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download size={17} />} onClick={() => showToast({ text: t('Ipapadala namin sa email mo ang kopya.', "We'll email you a copy."), expression: 'pointing' })}>
            {t('I-download ang data ko', 'Download my data')}
          </Button>
          <Button variant="danger" icon={<Trash2 size={17} />} onClick={() => setDel(true)}>
            {t('Burahin ang account', 'Delete account')}
          </Button>
        </div>
      </Card>
      <IOSAlert
        open={del}
        title={t('Burahin ang account?', 'Delete your account?')}
        message={t('Matatanggal ang negosyo mo sa Bitinary pagkatapos ng 30 araw. Puwede mo pang kanselahin sa panahong iyon.', 'Your business will be removed from Bitinary after 30 days. You can cancel during that time.')}
        actions={[
          { label: t('Kanselahin', 'Cancel'), onClick: () => setDel(false) },
          { label: t('Burahin', 'Delete'), destructive: true, bold: true, onClick: () => (setDel(false), showToast({ text: t('Naka-iskedyul ang pagbura sa loob ng 30 araw.', 'Deletion scheduled in 30 days.'), expression: 'sleeping' })) },
        ]}
      />
    </SubPage>
  )
}

export function HelpPage() {
  const { t, showToast } = useBiz()
  const [open, setOpen] = useState<number | null>(0)
  const faqs: [string, string][] = [
    [t('Gaano katagal ang verification?', 'How long does verification take?'), t('Karaniwang 1–2 araw ng trabaho pagkatapos ma-upload ang permit.', 'Usually 1–2 business days after you upload your permit.')],
    [t('Puwede bang tanggalin ang negatibong review?', 'Can I remove a negative review?'), t('Hindi tinatanggal ang negatibong review dahil lang negatibo ito. I-report lang kung lumalabag sa guidelines.', 'Negative reviews are not removed just because they are negative. Report only if it breaks the guidelines.')],
    [t('Paano gumagana ang Mga Dumating?', 'How does Customers sent work?'), t('Binibilang namin ang bawat deal na na-redeem sa QR o code sa counter mo.', 'We count every deal redeemed with a QR or code at your counter.')],
    [t('Libre ba ang Bitinary Business?', 'Is Bitinary Business free?'), t('Oo. Ang Plus at boosts ay opsyonal.', 'Yes. Plus and boosts are optional.')],
  ]
  return (
    <SubPage title={t('Tulong at suporta', 'Help and support')} phase="MVP">
      <Card className="flex flex-wrap items-center gap-4 bg-primary">
        <Jimbot expression="waving" variant="standalone" size={90} className="-my-3" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[20px] font-bold text-white">{t('Tulungan kami ng Bitinary team', 'Get help from the Bitinary team')}</p>
          <p className="text-[15px] font-semibold text-ink">{t('Lunes hanggang Sabado, 8 AM–6 PM', 'Monday to Saturday, 8 AM–6 PM')}</p>
        </div>
        <Button variant="brown" onClick={() => showToast({ text: t('Salamat! Makikipag-ugnayan ang team sa loob ng 1 oras.', 'Thanks! The team will reach out within 1 hour.') })}>
          {t('Humingi ng tulong', 'Request help')}
        </Button>
      </Card>
      <Group>
        <GroupRow icon={<Phone size={19} />} color="#1B8A3A" label={t('Tumawag', 'Call')} value="(02) 8888 2468" onClick={() => (location.href = 'tel:0288882468')} />
        <GroupRow icon={<MessageCircle size={19} />} color="#0B7F96" label="Messenger" value="m.me/bitinarybiz" />
        <GroupRow icon={<Mail size={19} />} color="#C84A00" label="Email" value="biz@bitinary.ph" onClick={() => (location.href = 'mailto:biz@bitinary.ph')} />
      </Group>
      <Card title="FAQs">
        <ul className="divide-y divide-line">
          {faqs.map(([q, a], i) => (
            <li key={q}>
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                <span className="flex-1 font-display text-[16px] font-medium">{q}</span>
                <ChevronDown size={18} className={cn('shrink-0 text-link transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && <p className="pb-3 text-[15px] text-fg-2">{a}</p>}
            </li>
          ))}
        </ul>
      </Card>
    </SubPage>
  )
}
