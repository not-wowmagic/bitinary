/** Business verification: DTI registration and Business (Mayor's) permit. */

export type VerifyDoc = { name: string; size: number; type: string; /** shrunk image data URL; PDFs have none */ data?: string }
export type VerifyStatus = 'none' | 'pending' | 'verified' | 'needs-docs' | 'rejected'
export type VerifyEvent = { at: string; status: VerifyStatus; by: 'owner' | 'reviewer'; /** developer name for reviewer events */ byName?: string; note?: string }
export type DocKey = 'dti' | 'permit'

export type Verification = {
  method?: 'upload' | 'onsite'
  /** DTI Business Name No., 7 digits */
  dtiNo?: string
  dtiRegistered?: string
  dtiValidUntil?: string
  permitNo?: string
  permitCity?: string
  permitIssued?: string
  permitValidUntil?: string
  docs: { dti?: VerifyDoc; permit?: VerifyDoc }
  onsiteDate?: string
  onsiteSlot?: 'morning' | 'afternoon'
  submittedAt?: string
  reviewedAt?: string
  reviewer?: string
  /** reviewer message to the owner */
  note?: string
  missing?: DocKey[]
  history: VerifyEvent[]
  status: VerifyStatus
  /** legacy file names (before DTI/permit fields existed) */
  files: string[]
}

export const emptyVerification: Verification = { docs: {}, history: [], status: 'none', files: [] }

/** Older saves only had `files` and a status; fill in the new fields. */
export function migrateVerification(v: Partial<Verification> | undefined): Verification {
  const x = { ...emptyVerification, ...(v ?? {}) }
  const docs = { ...(x.docs ?? {}) }
  if (!docs.dti && x.files?.[0]) docs.dti = { name: x.files[0], size: 0, type: 'application/pdf' }
  if (!docs.permit && x.files?.[1]) docs.permit = { name: x.files[1], size: 0, type: 'application/pdf' }
  return { ...x, docs, history: x.history ?? [], files: x.files ?? [] }
}

/* ------------------------------ Dates ------------------------------ */

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayISO = () => iso(new Date())
/** YYYY-MM-DD for n days from today (negative = past). */
export const dayOffset = (n: number) => iso(new Date(Date.now() + n * 864e5))
/** Whole days from today until a YYYY-MM-DD date (negative = past). */
export function daysUntil(date?: string) {
  if (!date) return Infinity
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date()
  return Math.round((new Date(y, m - 1, d).getTime() - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) / 864e5)
}
export const plusYears = (date: string, n: number) => {
  const [y, m, d] = date.split('-')
  return `${Number(y) + n}-${m}-${d}`
}
export const endOfYear = (date: string) => `${date.slice(0, 4)}-12-31`

export type VerifyState = VerifyStatus | 'expiring' | 'expired'
/** Status including permit expiry. A permit is expired the day after its valid-until date. */
export function verifyState(v: Verification): VerifyState {
  if (v.status !== 'verified') return v.status
  const left = daysUntil(v.permitValidUntil)
  if (left < 0) return 'expired'
  if (left <= 30) return 'expiring'
  return 'verified'
}
/** Travelers see the "Rehistradong negosyo" badge only for a current, approved registration. */
export const isRegistered = (v: Verification) => ['verified', 'expiring'].includes(verifyState(v))

/* ------------------------------ Validation ------------------------------ */

type T = (tl: string, en: string) => string
export function validateVerification(v: Verification, t: T, only?: DocKey[]) {
  const e: Record<string, string> = {}
  if (!v.method) e.method = t('Pumili kung paano ka magve-verify.', 'Choose how you will verify.')
  if (v.method === 'onsite') {
    if (!v.onsiteDate) e.onsiteDate = t('Pumili ng petsa.', 'Pick a date.')
    else if (daysUntil(v.onsiteDate) < 1) e.onsiteDate = t('Pumili ng petsa simula bukas.', 'Pick a date from tomorrow.')
    return e
  }
  if (v.method !== 'upload') return e
  const need = (k: DocKey) => !only?.length || only.includes(k)
  if (need('dti')) {
    if (!/^\d{7}$/.test(v.dtiNo ?? '')) e.dtiNo = t('7 numero ang DTI Business Name No.', 'The DTI Business Name No. has 7 digits.')
    if (!v.dtiRegistered) e.dtiRegistered = t('Ilagay ang petsa ng rehistro.', 'Enter the registration date.')
    else if (daysUntil(v.dtiRegistered) > 0) e.dtiRegistered = t('Hindi puwedeng sa hinaharap.', "Can't be in the future.")
    if (!v.dtiValidUntil) e.dtiValidUntil = t('Ilagay kung hanggang kailan.', 'Enter the valid-until date.')
    else if (daysUntil(v.dtiValidUntil) < 0) e.dtiValidUntil = t('Expired na ang DTI registration. I-renew muna.', 'This DTI registration has expired. Renew it first.')
    if (!v.docs.dti) e.dtiDoc = t('I-upload ang DTI certificate.', 'Upload the DTI certificate.')
  }
  if (need('permit')) {
    const p = (v.permitNo ?? '').trim()
    if (p.length < 4 || p.length > 30) e.permitNo = t('Ilagay ang permit number (4–30 letra).', 'Enter the permit number (4–30 characters).')
    if (!v.permitCity?.trim()) e.permitCity = t('Saang lungsod o bayan ito inilabas?', 'Which city or town issued it?')
    if (!v.permitIssued) e.permitIssued = t('Ilagay ang petsa ng pag-issue.', 'Enter the issue date.')
    else if (daysUntil(v.permitIssued) > 0) e.permitIssued = t('Hindi puwedeng sa hinaharap.', "Can't be in the future.")
    if (!v.permitValidUntil) e.permitValidUntil = t('Ilagay kung hanggang kailan.', 'Enter the valid-until date.')
    else if (v.permitIssued && v.permitValidUntil <= v.permitIssued) e.permitValidUntil = t('Dapat pagkatapos ng petsa ng pag-issue.', 'Must be after the issue date.')
    else if (daysUntil(v.permitValidUntil) < 0) e.permitValidUntil = t('Expired na ang permit. I-renew muna.', 'This permit has expired. Renew it first.')
    if (!v.docs.permit) e.permitDoc = t('I-upload ang business permit.', 'Upload the business permit.')
  }
  return e
}

export const MAX_DOC = 10 * 1024 * 1024
