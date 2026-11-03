import { useState, type ComponentType } from 'react'
import { Link } from 'react-router'
import { Check, Palette, Plus, Save, ShieldCheck, Trash2, Users } from 'lucide-react'
import { useAccount } from '@/app/account'
import { useDeveloperConfig, type DevBanner, type VerificationRecord } from '@/app/developer'
import { useTheme, type ThemeMode } from '@/app/theme'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { cn } from '@/lib/cn'
import { promos } from '@/data/promos'

type Tab = 'overview' | 'users' | 'banners' | 'theme' | 'verification'

const seedBanners: DevBanner[] = promos.map((p) => ({ ...p, active: true }))

export function Developer() {
  const { accounts } = useAccount()
  const { mode, setMode } = useTheme()
  const [config, save] = useDeveloperConfig()
  const [tab, setTab] = useState<Tab>('overview')
  const banners = config.banners.length ? config.banners : seedBanners
  const [draft, setDraft] = useState<DevBanner>(banners[0])
  const [editing, setEditing] = useState(false)

  const saveBanner = () => {
    const next = config.banners.some((b) => b.id === draft.id) ? config.banners.map((b) => (b.id === draft.id ? draft : b)) : [...banners, draft]
    save({ ...config, banners: next })
    setEditing(false)
  }
  const removeBanner = (id: string) => save({ ...config, banners: banners.filter((b) => b.id !== id) })
  const newBanner = () => {
    setDraft({ id: `banner-${Date.now()}`, title: '', subtitle: '', business: '', placeId: '', tone: 'orange', image: '', cta: 'Tingnan', until: '', active: true })
    setEditing(true)
  }

  return (
    <main className="min-h-dvh bg-bg px-4 py-6 md:px-8">
      <header className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-primary">Bitinary developer</p>
          <h1 className="mt-1 text-title">Control center</h1>
          <p className="text-body text-fg-2">Shared controls for the traveler and business apps.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="secondary">Traveler</Button></Link>
          <Link to="/biz"><Button variant="secondary">Business</Button></Link>
        </div>
      </header>

      <div className="mx-auto mt-6 flex max-w-[1400px] flex-wrap gap-2">
        {([
          ['overview', 'Overview'], ['users', 'Users'], ['banners', 'Ads & carousel'], ['theme', 'App theme'], ['verification', 'Verification'],
        ] as const).map(([id, label]) => <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Chip>)}
      </div>

      <section className="mx-auto mt-5 max-w-[1400px]">
        {tab === 'overview' && <Overview accounts={accounts.length} banners={banners.filter((b) => b.active).length} verifications={config.verifications.length} />}
        {tab === 'users' && <UsersPanel accounts={accounts} />}
        {tab === 'banners' && <BannersPanel banners={banners} editing={editing} draft={draft} setDraft={setDraft} onNew={newBanner} onSave={saveBanner} onEdit={(b) => { setDraft(b); setEditing(true) }} onRemove={removeBanner} />}
        {tab === 'theme' && <ThemePanel config={config} save={save} mode={mode} setMode={setMode} />}
        {tab === 'verification' && <VerificationPanel accounts={accounts} records={config.verifications} save={save} config={config} />}
      </section>
    </main>
  )
}

function Overview({ accounts, banners, verifications }: { accounts: number; banners: number; verifications: number }) {
  const cards: { label: string; value: number; Icon: ComponentType<{ size?: number; className?: string }> }[] = [
    { label: 'Users', value: accounts, Icon: Users },
    { label: 'Active banners', value: banners, Icon: Plus },
    { label: 'Verification records', value: verifications, Icon: ShieldCheck },
  ]
  return <div className="grid gap-4 md:grid-cols-3">{cards.map(({ label, value, Icon }) => <article key={label} className="card p-5"><Icon size={22} className="text-primary" /><p className="mt-5 text-caption text-fg-2">{label}</p><p className="text-3xl font-bold">{value}</p></article>)}</div>
}

function UsersPanel({ accounts }: { accounts: ReturnType<typeof useAccount>['accounts'] }) {
  return <div className="card overflow-hidden"><div className="border-b border-line p-5"><h2 className="text-h3">Account directory</h2><p className="text-body text-fg-2">Developer access uses account identity; no shared PIN.</p></div><div className="divide-y divide-line">{accounts.map((a) => <div key={a.id} className="flex flex-wrap items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-ink">{a.name[0]}</div><div className="min-w-[220px] flex-1"><p className="font-semibold">{a.name}</p><p className="text-caption text-fg-2">{a.email ?? a.mobile ?? 'No contact'} · {a.role}</p></div><span className="rounded-full bg-ok-bg px-3 py-1 text-xs font-semibold text-ok">Account</span></div>)}</div></div>
}

function BannersPanel({ banners, editing, draft, setDraft, onNew, onSave, onEdit, onRemove }: { banners: DevBanner[]; editing: boolean; draft: DevBanner; setDraft: (b: DevBanner) => void; onNew: () => void; onSave: () => void; onEdit: (b: DevBanner) => void; onRemove: (id: string) => void }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="space-y-3">{banners.map((b) => <article key={b.id} className={cn('card flex items-center gap-4 p-4', !b.active && 'opacity-50')}><img src={b.image.startsWith('http') ? b.image : `https://images.unsplash.com/${b.image}?auto=format&fit=crop&w=240&q=80`} alt="" className="h-20 w-28 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">{b.title || 'Untitled banner'}</p><p className="text-caption text-fg-2">{b.subtitle} · {b.active ? 'Active' : 'Hidden'}</p></div><Button size="sm" variant="secondary" onClick={() => onEdit(b)}>Edit</Button><button aria-label="Delete banner" onClick={() => onRemove(b.id)} className="p-2 text-danger"><Trash2 size={17} /></button></article>)}<Button onClick={onNew} icon={<Plus size={16} />}>Add banner</Button></div>{editing && <BannerForm draft={draft} setDraft={setDraft} onSave={onSave} />}</div>
}

function BannerForm({ draft, setDraft, onSave }: { draft: DevBanner; setDraft: (b: DevBanner) => void; onSave: () => void }) {
  const field = (key: Exclude<keyof DevBanner, 'active'>, label: string) => <label className="block space-y-1"><span className="text-caption font-semibold">{label}</span><input value={String(draft[key])} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="input w-full" /></label>
  return <div className="card space-y-3 p-5"><h2 className="text-h3">Banner settings</h2>{field('title', 'Title')}{field('subtitle', 'Subtitle')}{field('business', 'Business')}{field('image', 'Image URL or Unsplash photo id')}{field('until', 'Expiry label')}{field('cta', 'Button label')}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label><Button onClick={onSave} icon={<Save size={16} />}>Save and sync</Button></div>
}

function ThemePanel({ config, save, mode, setMode }: { config: ReturnType<typeof useDeveloperConfig>[0]; save: ReturnType<typeof useDeveloperConfig>[1]; mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const [theme, setTheme] = useState(config.theme)
  return <div className="card max-w-xl space-y-4 p-5"><div className="flex items-center gap-3"><Palette className="text-primary" /><div><h2 className="text-h3">Global theme</h2><p className="text-caption text-fg-2">Applied to traveler and business surfaces.</p></div></div><div className="grid grid-cols-2 gap-3">{(['primary', 'brown', 'cream'] as const).map((key) => <label key={key} className="space-y-1"><span className="text-caption font-semibold capitalize">{key}</span><input type="color" value={theme[key]} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} className="h-11 w-full rounded-lg" /></label>)}</div><label className="block space-y-1"><span className="text-caption font-semibold">Corner radius</span><input type="range" min="8" max="32" value={theme.radius} onChange={(e) => setTheme({ ...theme, radius: e.target.value })} className="w-full" /></label><div className="flex gap-2">{(['system', 'light', 'dark'] as const).map((x) => <Chip key={x} active={mode === x} onClick={() => setMode(x)}>{x}</Chip>)}</div><Button onClick={() => save({ ...config, theme })} icon={<Save size={16} />}>Save and sync theme</Button></div>
}

function VerificationPanel({ accounts, records, save, config }: { accounts: ReturnType<typeof useAccount>['accounts']; records: VerificationRecord[]; save: ReturnType<typeof useDeveloperConfig>[1]; config: ReturnType<typeof useDeveloperConfig>[0] }) {
  const [record, setRecord] = useState<VerificationRecord>({ accountId: accounts.find((a) => a.role === 'business')?.id ?? '', businessName: '', submittedAt: new Date().toISOString().slice(0, 10), dtiNumber: '', dtiDate: '', permitNumber: '', permitDate: '', status: 'pending' })
  const submit = () => save({ ...config, verifications: [...records.filter((x) => x.accountId !== record.accountId), record] })
  return <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><div className="card space-y-3 p-5"><h2 className="text-h3">Business verification</h2><select value={record.accountId} onChange={(e) => setRecord({ ...record, accountId: e.target.value })} className="input w-full">{accounts.filter((a) => a.role === 'business').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>{(['businessName', 'dtiNumber', 'dtiDate', 'permitNumber', 'permitDate'] as const).map((key) => <input key={key} placeholder={key} value={record[key]} onChange={(e) => setRecord({ ...record, [key]: e.target.value })} className="input w-full" />)}<select value={record.status} onChange={(e) => setRecord({ ...record, status: e.target.value as VerificationRecord['status'] })} className="input w-full"><option value="pending">Pending</option><option value="verified">Verified</option><option value="needs-docs">Needs documents</option></select><Button onClick={submit} icon={<Check size={16} />}>Save verification</Button></div><div className="space-y-3">{records.map((r) => <article key={r.accountId} className="card p-4"><p className="font-semibold">{r.businessName || 'Unnamed business'}</p><p className="text-caption text-fg-2">DTI {r.dtiNumber || '—'} ({r.dtiDate || 'no date'}) · Permit {r.permitNumber || '—'} ({r.permitDate || 'no date'})</p><span className="text-sm font-semibold text-primary">{r.status}</span></article>)}</div></div>
}
