import { supabase } from '@/lib/supabase'
import { execute, throwIfError, type DbResult } from './result'
import { assertBusinessOwner } from './entity'
export type CommentRow = { id: string; post_id: string; author_id: string | null; body: string; reply: string | null; hidden: boolean; reported_reason: string | null; blocked: boolean; created_at: string }
async function ownedComment(id: string, businessId: string) {
  const posts = await supabase.from('posts').select('id').eq('business_id', businessId)
  throwIfError(posts.error)
  const postIds = (posts.data ?? []).map((post) => post.id)
  const comment = await supabase.from('comments').select('*').eq('id', id).in('post_id', postIds).maybeSingle()
  throwIfError(comment.error)
  if (!comment.data) throw new Error('Comment not found in this business.')
  return comment.data as CommentRow
}
export function loadComments(businessId: string): Promise<DbResult<CommentRow[]>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { data: posts, error: postsError } = await supabase.from('posts').select('id').eq('business_id', businessId)
    throwIfError(postsError)
    const ids = (posts ?? []).map((post) => post.id)
    if (!ids.length) return []
    const { data, error } = await supabase.from('comments').select('*').in('post_id', ids).order('created_at', { ascending: false })
    throwIfError(error)
    return data as CommentRow[]
  })
}
export function createComment(businessId: string, comment: Omit<CommentRow, 'id' | 'created_at'>): Promise<DbResult<CommentRow>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const { data, error } = await supabase.from('comments').insert(comment).select('*').single()
    throwIfError(error)
    return data as CommentRow
  })
}
export function updateComment(businessId: string, id: string, patch: Partial<CommentRow>): Promise<DbResult<CommentRow>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const row = await ownedComment(id, businessId)
    const { data, error } = await supabase.from('comments').update(patch).eq('id', row.id).eq('post_id', row.post_id).select('*').single()
    throwIfError(error)
    return data as CommentRow
  })
}
export function deleteComment(businessId: string, id: string): Promise<DbResult<null>> {
  return execute(async () => {
    await assertBusinessOwner(businessId)
    const row = await ownedComment(id, businessId)
    const { error } = await supabase.from('comments').delete().eq('id', row.id).eq('post_id', row.post_id)
    throwIfError(error)
    return null
  })
}
