import type { BizThemeId, BusinessProfile } from '@/app/account'
import { REQUIRED_BIZ, bizThemes } from '@/data/themes'

export function useBizView(real: BusinessProfile): BusinessProfile {
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
