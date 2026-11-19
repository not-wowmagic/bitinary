import { supabase } from '@/lib/supabase'
import { execute, throwIfError, type DbResult } from './result'
import { assertBusinessOwner } from './entity'
export type BranchRow = { id: string; business_id: string; name: string; area: string; created_at: string }
export type StaffRow = { business_id: string; user_id: string | null; email: string; name: string; role: 'owner' | 'manager' | 'staff'; status: 'active' | 'invited'; branch_id: string | null }
export function loadBranches(businessId: string): Promise<DbResult<BranchRow[]>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { data, error } = await supabase.from('branches').select('*').eq('business_id', businessId); throwIfError(error); return data as BranchRow[] })
}
export function createBranch(businessId: string, values: Pick<BranchRow, 'name' | 'area'>): Promise<DbResult<BranchRow>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { data, error } = await supabase.from('branches').insert({ ...values, business_id: businessId }).select('*').single(); throwIfError(error); return data as BranchRow })
}
export function updateBranch(businessId: string, id: string, values: Partial<Pick<BranchRow, 'name' | 'area'>>): Promise<DbResult<BranchRow>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { data, error } = await supabase.from('branches').update(values).eq('business_id', businessId).eq('id', id).select('*').single(); throwIfError(error); return data as BranchRow })
}
export function deleteBranch(businessId: string, id: string): Promise<DbResult<null>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { error } = await supabase.from('branches').delete().eq('business_id', businessId).eq('id', id); throwIfError(error); return null })
}
export function loadStaff(businessId: string): Promise<DbResult<StaffRow[]>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { data, error } = await supabase.from('business_staff').select('*').eq('business_id', businessId); throwIfError(error); return data as StaffRow[] })
}
export function createStaff(values: StaffRow): Promise<DbResult<StaffRow>> {
  return execute(async () => { await assertBusinessOwner(values.business_id); const { data, error } = await supabase.from('business_staff').insert(values).select('*').single(); throwIfError(error); return data as StaffRow })
}
export function updateStaff(businessId: string, email: string, values: Partial<Omit<StaffRow, 'business_id' | 'email'>>): Promise<DbResult<StaffRow>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { data, error } = await supabase.from('business_staff').update(values).eq('business_id', businessId).eq('email', email).select('*').single(); throwIfError(error); return data as StaffRow })
}
export function deleteStaff(businessId: string, email: string): Promise<DbResult<null>> {
  return execute(async () => { await assertBusinessOwner(businessId); const { error } = await supabase.from('business_staff').delete().eq('business_id', businessId).eq('email', email); throwIfError(error); return null })
}
