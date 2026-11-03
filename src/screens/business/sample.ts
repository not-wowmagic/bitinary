import { emptyBusiness, type BizThemeId, type BusinessProfile } from '@/app/account'
import { REQUIRED_BIZ, bizThemes } from '@/data/themes'
import { getForcedState, isEmbed } from '@/lib/forced'

const sampleBase: BusinessProfile = {
  ...emptyBusiness,
  name: 'Kapihan ni Aling Nena',
  type: 'kapihan',
  price: '₱',
  address: '45 Calle Real, Intramuros',
  city: 'Maynila',
  pin: { x: 50, y: 46 },
  contactName: 'Nena Santos',
  mobile: '9181234567',
  menu: [
    { id: 'a', name: 'Kapeng Barako', price: '85', category: 'Inumin' },
    { id: 'b', name: 'Bibingka', price: '65', category: 'Merienda' },
    { id: 'c', name: 'Puto bumbong', price: '70', category: 'Merienda' },
  ],
  status: { basics: 'done', location: 'done', hours: 'done', contact: 'done' },
}

/** Screen Index frames show sample data so every state is reviewable without clicking through. */
export function useBizView(real: BusinessProfile): BusinessProfile {
  const s = getForcedState()
  if (s === 'draft') return { ...sampleBase, menu: [], status: { basics: 'done', location: 'done' }, live: false }
  if (s === 'verified') return { ...sampleBase, live: true, verification: { method: 'upload', files: ['dti.pdf', 'permit.jpg'], status: 'verified' }, status: { ...sampleBase.status, menu: 'done', verify: 'done' } }
  if (s === 'live') return { ...sampleBase, live: true }
  if (s === 'sample' || (isEmbed() && !real.name)) return sampleBase
  return real
}

export const requiredDone = (b: BusinessProfile) => REQUIRED_BIZ.filter((id) => b.status[id] === 'done').length
export const optionalIds = bizThemes.filter((x) => !x.required).map((x) => x.id) as BizThemeId[]
/** Profile Health Score: the 4 required themes are the base (60), each optional theme adds to it. */
export function healthScore(b: BusinessProfile) {
  const opt = optionalIds.filter((id) => b.status[id] === 'done').length
  return Math.min(100, Math.round(requiredDone(b) * 15 + (opt * 40) / optionalIds.length))
}
export function bizStatus(b: BusinessProfile): 'draft' | 'live' | 'pending' | 'verified' {
  if (!b.live) return 'draft'
  return b.verification.status === 'verified' ? 'verified' : b.verification.status === 'pending' ? 'pending' : 'live'
}
