import { supabase } from '@/lib/supabase'
import { execute, throwIfError, type DbResult } from './result'
import { assertBusinessOwner } from './entity'
export type ReviewCaseRow = { id: string; review_id: string; reason: string; explanation: string; evidence_urls: string[]; status: string; timeline: unknown[]; messages: unknown[]; created_at: string; decided_at: string | null }
async function assertOwnedReview(businessId: string, reviewId: string) {
  const { data, error } = await supabase.from('reviews').select('id').eq('business_id', businessId).eq('id', reviewId).maybeSingle()
  throwIfError(error)
  if (!data) throw new Error('Review not found in this business.')
}
export function loadReviewCases(businessId: string): Promise<DbResult<ReviewCaseRow[]>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { data: reviews, error: reviewsError } = await supabase.from('reviews').select('id').eq('business_id', businessId)
    throwIfError(reviewsError)
    const ids = (reviews ?? []).map((review) => review.id)
    if (!ids.length) return []
    const { data, error } = await supabase.from('review_cases').select('*').in('review_id', ids)
    throwIfError(error)
    return data as ReviewCaseRow[]
  })
}
export function createReviewCase(businessId: string, row: Omit<ReviewCaseRow, 'id' | 'created_at'>): Promise<DbResult<ReviewCaseRow>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    await assertOwnedReview(businessId, row.review_id)
    const { data, error } = await supabase.from('review_cases').insert(row).select('*').single()
    throwIfError(error)
    return data as ReviewCaseRow
  })
}
export function updateReviewCase(businessId: string, id: string, patch: Partial<ReviewCaseRow>): Promise<DbResult<ReviewCaseRow>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { data, error } = await supabase.from('review_cases').update(patch).eq('id', id).select('*').single()
    throwIfError(error)
    return data as ReviewCaseRow
  })
}
export function deleteReviewCase(businessId: string, id: string): Promise<DbResult<null>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { error, data } = await supabase.from('review_cases').delete().eq('id', id).select('id').maybeSingle()
    throwIfError(error)
    if (!data) throw new Error('Report case not found or access was denied.')
    return null
  })
}
