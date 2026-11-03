import { CalendarDays, Clock, FileUp, Globe, Image as ImageIcon, ImagePlus, Info, ListChecks, MapPin, Paperclip, Phone, Save, ShieldCheck, Store, Users, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { BizThemeId, BusinessProfile } from '@/app/account'
import { ChoiceChip, SelectCard, inputBase } from '@/components/flow/Fields'
import { Facebook, Instagram } from '@/components/icons/Brand'
import { CitySearch, HoursPicker, MapPinDropper, MenuRows } from '@/components/onboarding/BizWidgets'
import { OptTag, PriceChips, ReqTag } from '@/components/onboarding/Kit'
import { Button } from '@/components/ui/Button'
import { PH_PLACES, bizTypeOpts, langOpts, menuCategories, priceHint } from '@/data/themes'
import { cn } from '@/lib/cn'
import { shrink } from '@/screens/personalize/TravelerThemes'
import { formatPH, validPH, PhFlag } from '@/screens/signup/Signup'
import { longDate } from '../format'
import { useBiz, useBusiness } from '../store'
import { BizStatusChip, Card, PageHeader, Pill } from '../ui'
import { StatsTabs } from './Overview'

type SectionId = BizThemeId
const field = cn(inputBase, 'border-line')

function Field({ label, error, children, optional }: { label: string; error?: string; children: ReactNode; optional?: boolean }) {
  const { t } = useBiz()
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 font-display text-[14px] font-medium">
        {label}
        {optional && <span className="rounded-md bg-sunken px-1.5 py-0.5 text-[11px] text-fg-2 dark:bg-elevated">{t('Opsyonal', 'Optional')}</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-[14px] font-semibold text-danger">
          {error}
        </span>
      )}
    </label>
  )
}

/** One editable section: keeps its own draft, shows Required/Optional, last updated and Save. */
function Section<K extends keyof BusinessProfile>({ id, keys, title, icon, required, validate, children }: { id: SectionId; keys: K[]; title: string; icon: ReactNode; required?: boolean; validate?: (d: Pick<BusinessProfile, K>) => Record<string, string>; children: (d: Pick<BusinessProfile, K>, set: (p: Partial<Pick<BusinessProfile, K>>) => void, e: Record<string, string>) => ReactNode }) {
  const { d, set: setData, t, lang, showToast } = useBiz()
  const pick = () => Object.fromEntries(keys.map((k) => [k, d.business[k]])) as Pick<BusinessProfile, K>
  const [draft, setDraft] = useState(pick)
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    setDraft(pick())
  }, [d.business]) // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(draft) !== JSON.stringify(pick())
  const save = () => {
    const e = validate?.(draft) ?? {}
    setErrors(e)
    if (Object.keys(e).length) return
    setData((x) => ({ ...x, business: { ...x.business, ...draft, status: { ...x.business.status, [id]: 'done' } }, updated: { ...x.updated, [id]: new Date().toISOString() } }))
    showToast({ text: t('Na-save!', 'Saved!'), expression: 'celebrating' })
  }
  const updated = d.updated[id]
  return (
    <Card id={id} className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-elevated">{icon}</span>
        <h2 className="text-h3">{title}</h2>
        {required ? <ReqTag /> : <OptTag />}
        <span className="ml-auto text-[13px] text-fg-2">{updated ? t(`Na-update: ${longDate(updated, lang)}`, `Updated ${longDate(updated, lang)}`) : t('Hindi pa naa-update', 'Not updated yet')}</span>
      </div>
      <div className="space-y-4">{children(draft, (p) => (setDraft((x) => ({ ...x, ...p })), setErrors({})), errors)}</div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
        {dirty && <span className="mr-auto text-[14px] font-semibold text-caution">{t('May hindi pa nase-save', 'Unsaved changes')}</span>}
        {dirty && (
          <Button variant="ghost" onClick={() => setDraft(pick())}>
            {t('Kanselahin', 'Cancel')}
          </Button>
        )}
        <Button icon={<Save size={17} />} disabled={!dirty} onClick={save}>
          {t('I-save', 'Save')}
        </Button>
      </div>
    </Card>
  )
}

export function Backgrounds() {
  const { t, lang, status, set, d } = useBiz()
  const [b] = useBusiness()
  const { hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }, [hash])
  const hints = Object.fromEntries(Object.entries(priceHint).map(([k, v]) => [k, v[lang === 'en' ? 1 : 0]]))
  const index: [SectionId | 'team', string][] = [
    ['basics', t('Negosyo', 'Basics')],
    ['location', t('Lokasyon', 'Location')],
    ['hours', t('Oras', 'Opening hours')],
    ['contact', 'Contact'],
    ['menu', t('Menu at presyo', 'Menu and prices')],
    ['photos', t('Mga larawan', 'Photos')],
    ['about', t('Kuwento at specialty', 'About and specialties')],
    ['online', 'Online'],
    ['verify', t('Permit at verification', 'Permits and verification')],
    ['team', t('Branch at staff', 'Branches and staff')],
  ]
  const v = b.verification

  return (
    <main>
      <PageHeader title={t('Statistika', 'Statistics')} phase="MVP" tabs={<StatsTabs />} sub={t('I-edit ang impormasyon ng negosyo mo. Bawat seksyon ay may sariling Save.', 'Edit your business information. Each section has its own Save.')} />
      <div className="grid gap-6 px-4 md:px-8 xl:grid-cols-[230px_1fr]">
        <nav aria-label={t('Mga seksyon', 'Sections')} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 xl:sticky xl:top-24 xl:mx-0 xl:h-fit xl:flex-col xl:gap-0.5 xl:overflow-visible xl:px-0">
          {index.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line px-3 text-[15px] hover:bg-sunken xl:rounded-[12px] xl:border-0">
              <span className={cn('h-2 w-2 rounded-full', id !== 'team' && b.status[id as SectionId] === 'done' ? 'bg-ok' : 'bg-line')} aria-hidden />
              {label}
            </a>
          ))}
        </nav>
        <div className="min-w-0 space-y-4">
          <Section id="basics" keys={['name', 'type', 'price']} title={t('Negosyo', 'Basics')} icon={<Store size={20} />} required validate={(x) => ({ ...(x.name.trim().length < 2 && { name: t('Ilagay ang pangalan.', 'Enter a name.') }), ...(!x.type && { type: t('Pumili ng uri.', 'Choose a type.') }) })}>
            {(x, s, e) => (
              <>
                <Field label={t('Pangalan ng negosyo', 'Business name')} error={e.name}>
                  <input value={x.name} onChange={(ev) => s({ name: ev.target.value })} className={cn(field, e.name && 'border-danger')} />
                </Field>
                <Field label={t('Uri', 'Type')} error={e.type}>
                  <div className="flex flex-wrap gap-2">
                    {bizTypeOpts.map((o) => (
                      <ChoiceChip key={o.id} multi={false} selected={x.type === o.id} onClick={() => s({ type: o.id })}>
                        {o[lang]}
                      </ChoiceChip>
                    ))}
                  </div>
                </Field>
                <Field label={t('Price range', 'Price range')}>
                  <PriceChips value={x.price} onChange={(p) => s({ price: p })} hints={hints} />
                </Field>
              </>
            )}
          </Section>

          <Section id="location" keys={['address', 'city', 'pin']} title={t('Lokasyon', 'Location')} icon={<MapPin size={20} />} required validate={(x) => ({ ...(x.address.trim().length < 4 && { address: t('Ilagay ang address.', 'Enter the address.') }), ...(!x.city && { city: t('Pumili ng lungsod.', 'Choose a city.') }) })}>
            {(x, s, e) => (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <Field label="Street address" error={e.address}>
                    <input value={x.address} onChange={(ev) => s({ address: ev.target.value })} className={cn(field, e.address && 'border-danger')} />
                  </Field>
                  <Field label={t('Lungsod o probinsya', 'City or province')} error={e.city}>
                    <CitySearch value={x.city} onChange={(c) => s({ city: c })} options={PH_PLACES} error={!!e.city} />
                  </Field>
                </div>
                <Field label={t('Map pin', 'Map pin')}>
                  <MapPinDropper value={x.pin} onChange={(p) => s({ pin: p })} />
                </Field>
              </div>
            )}
          </Section>

          <Section id="hours" keys={['hours']} title={t('Oras ng bukas', 'Opening hours')} icon={<Clock size={20} />} required>
            {(x, s) => <HoursPicker value={x.hours} onChange={(h) => s({ hours: h })} />}
          </Section>

          <Section id="contact" keys={['contactName', 'mobile', 'landline']} title="Contact" icon={<Phone size={20} />} required validate={(x) => ({ ...(!validPH(x.mobile) && { mobile: t('Dapat 10 digit at nagsisimula sa 9.', 'Must be 10 digits starting with 9.') }) })}>
            {(x, s, e) => (
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label={t('Contact person', 'Contact person')}>
                  <input value={x.contactName} onChange={(ev) => s({ contactName: ev.target.value })} className={field} />
                </Field>
                <Field label="Mobile" error={e.mobile}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 font-display">
                      <PhFlag /> +63
                    </span>
                    <input value={formatPH(x.mobile)} inputMode="numeric" onChange={(ev) => s({ mobile: ev.target.value.replace(/\D/g, '').slice(0, 10) })} className={cn(field, 'pl-[92px]', e.mobile && 'border-danger')} />
                  </div>
                </Field>
                <Field label="Landline" optional>
                  <input value={x.landline} onChange={(ev) => s({ landline: ev.target.value })} className={field} />
                </Field>
              </div>
            )}
          </Section>

          <Section id="menu" keys={['menu']} title={t('Menu at presyo', 'Menu and prices')} icon={<ListChecks size={20} />}>
            {(x, s) => <MenuRows items={x.menu} onChange={(m) => s({ menu: m })} categories={menuCategories} />}
          </Section>

          <Section id="photos" keys={['cover', 'photos']} title={t('Mga larawan', 'Photos')} icon={<ImageIcon size={20} />}>
            {(x, s) => (
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <Field label="Cover">
                  <label className="relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed border-line bg-sunken dark:bg-elevated">
                    {x.cover ? <img src={x.cover} alt="" className="h-full w-full object-cover" /> : <span className="flex items-center gap-2 font-display text-link"><ImagePlus size={20} /> {t('Pumili ng cover', 'Choose a cover')}</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={async (ev) => ev.target.files?.[0] && s({ cover: await shrink(ev.target.files[0], 1200) })} />
                  </label>
                </Field>
                <Field label={t(`Hanggang 6 na larawan (${x.photos.length}/6)`, `Up to 6 photos (${x.photos.length}/6)`)}>
                  <div className="grid grid-cols-3 gap-2">
                    {x.photos.map((p, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-[12px]">
                        <img src={p} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => s({ photos: x.photos.filter((_, j) => j !== i) })} aria-label={t('Tanggalin', 'Remove')} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    {x.photos.length < 6 && (
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[12px] border-2 border-dashed border-line text-link">
                        <ImagePlus size={22} />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={async (ev) => s({ photos: [...x.photos, ...(await Promise.all(Array.from(ev.target.files ?? []).slice(0, 6 - x.photos.length).map((f) => shrink(f))))].slice(0, 6) })} />
                      </label>
                    )}
                  </div>
                </Field>
              </div>
            )}
          </Section>

          <Section id="about" keys={['about', 'specialties', 'languages']} title={t('Kuwento at specialty', 'About and specialties')} icon={<Info size={20} />}>
            {(x, s) => (
              <>
                <Field label={t('Maikling paglalarawan', 'Short description')}>
                  <textarea value={x.about} maxLength={150} rows={3} onChange={(ev) => s({ about: ev.target.value })} className={cn(field, 'h-auto resize-none py-3')} />
                  <span className="mt-1 block text-right text-[13px] text-fg-2">{x.about.length}/150</span>
                </Field>
                <Field label={t('Mga specialty (hiwalayin ng kuwit)', 'Specialties (comma separated)')}>
                  <input value={x.specialties.join(', ')} onChange={(ev) => s({ specialties: ev.target.value.split(',').map((y) => y.trimStart()) })} className={field} />
                </Field>
                <Field label={t('Mga wikang sinasalita', 'Languages spoken')}>
                  <div className="flex flex-wrap gap-2">
                    {langOpts.map((l) => (
                      <ChoiceChip key={l} selected={x.languages.includes(l)} onClick={() => s({ languages: x.languages.includes(l) ? x.languages.filter((y) => y !== l) : [...x.languages, l] })}>
                        {l}
                      </ChoiceChip>
                    ))}
                  </div>
                </Field>
              </>
            )}
          </Section>

          <Section id="online" keys={['links']} title="Online" icon={<Globe size={20} />}>
            {(x, s) => (
              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ['facebook', 'Facebook', <Facebook size={18} key="f" />],
                    ['instagram', 'Instagram', <Instagram size={18} key="i" />],
                    ['tiktok', 'TikTok', <Globe size={18} key="t" />],
                    ['website', 'Website', <Globe size={18} key="w" />],
                  ] as const
                ).map(([k, l, ic]) => (
                  <Field key={k} label={l} optional>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-link">{ic}</span>
                      <input value={x.links[k]} onChange={(ev) => s({ links: { ...x.links, [k]: ev.target.value } })} className={cn(field, 'pl-11')} />
                    </div>
                  </Field>
                ))}
              </div>
            )}
          </Section>

          <Card id="verify" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-elevated">
                <ShieldCheck size={20} />
              </span>
              <h2 className="text-h3">{t('Permit at verification', 'Permits and verification')}</h2>
              <OptTag />
              <span className="ml-auto">
                <BizStatusChip status={status} />
              </span>
            </div>
            {v.status === 'needs-docs' && <p className="mb-3 rounded-[14px] bg-danger-bg px-4 py-3 text-[15px] font-semibold text-danger">{t('Malabo ang mayor’s permit. Mag-upload ng mas malinaw na kopya.', "The mayor's permit is unclear. Upload a clearer copy.")}</p>}
            <div className="grid gap-3 md:grid-cols-2">
              <SelectCard selected={v.method === 'upload'} onClick={() => set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, method: 'upload' } } }))} icon={<FileUp size={24} />} title={t('Mag-upload ng permit', 'Upload a permit')} body={t('DTI o SEC, at Mayor’s permit', "DTI or SEC, and Mayor's permit")} />
              <SelectCard selected={v.method === 'onsite'} onClick={() => set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, method: 'onsite' } } }))} icon={<CalendarDays size={24} />} title={t('Mag-iskedyul ng on-site check', 'Schedule an on-site check')} body={t('Libre, bibisita ang team', 'Free, the team visits')} />
            </div>
            {v.method === 'upload' && (
              <ul className="mt-3 space-y-2">
                {[t('DTI o SEC registration', 'DTI or SEC registration'), t("Mayor's permit", "Mayor's permit")].map((doc, i) => (
                  <li key={doc}>
                    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[16px] border border-line px-3 py-2">
                      <Paperclip size={20} className={v.files[i] ? 'text-ok' : 'text-link'} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15px] font-semibold">{doc}</span>
                        <span className="block truncate text-[14px] text-fg-2">{v.files[i] ?? t('PDF o larawan, hanggang 10 MB', 'PDF or photo, up to 10 MB')}</span>
                      </span>
                      {v.files[i] ? <Pill tone="ok">{t('Na-upload', 'Uploaded')}</Pill> : <span className="font-display text-[14px] font-medium text-link">{t('Pumili', 'Choose')}</span>}
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(ev) => ev.target.files?.[0] && set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, files: Object.assign([...x.business.verification.files], { [i]: ev.target.files![0].name }) } } }))} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {v.method === 'onsite' && (
              <label className="mt-3 block">
                <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Petsa ng pagbisita', 'Visit date')}</span>
                <input type="date" value={v.onsiteDate ?? ''} onChange={(ev) => set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, onsiteDate: ev.target.value } } }))} className={field} />
              </label>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button
                disabled={!v.method || v.status === 'verified' || v.status === 'pending' || (v.method === 'upload' && v.files.filter(Boolean).length === 0) || (v.method === 'onsite' && !v.onsiteDate)}
                onClick={() => set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, status: 'pending' }, status: { ...x.business.status, verify: 'done' } }, updated: { ...x.updated, verify: new Date().toISOString() } }))}
              >
                {v.status === 'pending' ? t('Naipadala na', 'Submitted') : t('Ipadala para ma-verify', 'Submit for verification')}
              </Button>
              <span className="text-[13px] text-fg-2">{t('Demo:', 'Demo:')}</span>
              <Button size="sm" variant="ghost" onClick={() => set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, status: 'verified' } } }))}>
                {t('Aprubahan', 'Approve')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => set((x) => ({ ...x, business: { ...x.business, verification: { ...x.business.verification, status: 'needs-docs' } } }))}>
                {t('Kulang ang dokumento', 'Needs documents')}
              </Button>
            </div>
          </Card>

          <Card id="team" title={t('Branch at staff', 'Branches and staff')} icon={<Users size={20} />} className="scroll-mt-24" phase="MVP" action={<Button variant="secondary" onClick={() => navigate('/biz/account/team')}>{t('Pamahalaan', 'Manage')}</Button>}>
            <div className="grid gap-3 md:grid-cols-2">
              <ul className="divide-y divide-line rounded-[16px] border border-line">
                {d.branches.map((br) => (
                  <li key={br.id} className="flex min-h-12 items-center justify-between px-3 py-2 text-[15px]">
                    <span className="font-semibold">{br.name}</span>
                    <span className="text-fg-2">{br.area}</span>
                  </li>
                ))}
              </ul>
              <ul className="divide-y divide-line rounded-[16px] border border-line">
                {d.staff.slice(0, 4).map((s) => (
                  <li key={s.id} className="flex min-h-12 items-center justify-between gap-2 px-3 py-2 text-[15px]">
                    <span className="truncate">{s.name}</span>
                    <Pill tone={s.role === 'owner' ? 'orange' : 'default'}>{s.role === 'owner' ? 'Owner' : s.role === 'manager' ? 'Manager' : 'Staff'}</Pill>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
