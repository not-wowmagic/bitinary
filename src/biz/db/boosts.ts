import type { Boost } from '../seed'
import { createBusinessRow, deleteBusinessRow, loadBusinessRows, updateBusinessRow } from './entity'
export type BoostRow = { id: string; business_id: string; post_id: string; budget: number; days: number; target: Boost['target']; status: Boost['status']; starts_at: string; reach: number; clicks: number; saves: number }
export const loadBoosts = (businessId: string) => loadBusinessRows<BoostRow>('boosts', businessId)
export const createBoost = (businessId: string, boost: Omit<BoostRow, 'id' | 'business_id'>) => createBusinessRow<BoostRow>('boosts', businessId, boost)
export const updateBoost = (businessId: string, id: string, patch: Partial<BoostRow>) => updateBusinessRow<BoostRow>('boosts', businessId, id, patch)
export const deleteBoost = (businessId: string, id: string) => deleteBusinessRow('boosts', businessId, id)
