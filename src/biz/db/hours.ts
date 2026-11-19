import { supabase } from '@/lib/supabase'
import { execute, throwIfError, type DbResult } from './result'
import { assertBusinessOwner } from './entity'

export type BusinessHourRow = { business_id: string; day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean; all_day: boolean }
export function loadHours(businessId: string): Promise<DbResult<BusinessHourRow[]>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { data, error } = await supabase.from('business_hours').select('*').eq('business_id', businessId).order('day_of_week')
    throwIfError(error)
    return data as BusinessHourRow[]
  })
}
export function createHour(row: BusinessHourRow): Promise<DbResult<BusinessHourRow>> {
  return execute(async () => {
    await assertBusinessOwner(row.business_id)
    const { data, error } = await supabase.from('business_hours').insert(row).select('*').single()
    throwIfError(error)
    return data as BusinessHourRow
  })
}
export function updateHour(businessId: string, day: number, patch: Partial<BusinessHourRow>): Promise<DbResult<BusinessHourRow>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { data, error } = await supabase.from('business_hours').update(patch).eq('business_id', businessId).eq('day_of_week', day).select('*').single()
    throwIfError(error)
    return data as BusinessHourRow
  })
}
export function deleteHour(businessId: string, day: number): Promise<DbResult<null>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { error } = await supabase.from('business_hours').delete().eq('business_id', businessId).eq('day_of_week', day)
    throwIfError(error)
    return null
  })
}
