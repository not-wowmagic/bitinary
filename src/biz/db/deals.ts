import type { Deal } from '../seed'
import { createBusinessRow, deleteBusinessRow, loadBusinessRows, updateBusinessRow } from './entity'
export type DealRow = { id: string; business_id: string; kind: Deal['kind']; item: string; percent: number | null; min_spend: number | null; addon: string | null; starts_at: string; ends_at: string; limit_per_day: number; limit_total: number; redemption: Deal['redemption']; code: string; status: Deal['status']; redeemed_qr: number; redeemed_code: number; views: number }
export const loadDeals = (businessId: string) => loadBusinessRows<DealRow>('deals', businessId)
export const createDeal = (businessId: string, deal: Omit<DealRow, 'id' | 'business_id'>) => createBusinessRow<DealRow>('deals', businessId, deal)
export const updateDeal = (businessId: string, id: string, patch: Partial<DealRow>) => updateBusinessRow<DealRow>('deals', businessId, id, patch)
export const deleteDeal = (businessId: string, id: string) => deleteBusinessRow('deals', businessId, id)
