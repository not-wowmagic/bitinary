import { supabase } from '@/lib/supabase'
import { execute, throwIfError, type DbResult } from './result'
export type NotificationRow = { id: string; user_id: string; kind: string; title: string; body: string; target: string | null; read_at: string | null; created_at: string }
async function ownerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sign in to load business notifications.')
  return data.user.id
}
export function loadNotifications(): Promise<DbResult<NotificationRow[]>> {
  return execute(async () => {
    const userId = await ownerId()
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    throwIfError(error)
    return data as NotificationRow[]
  })
}
export function createNotification(notification: Omit<NotificationRow, 'id' | 'user_id' | 'created_at'>): Promise<DbResult<NotificationRow>> {
  return execute(async () => {
    const userId = await ownerId()
    const { data, error } = await supabase.from('notifications').insert({ ...notification, user_id: userId }).select('*').single()
    throwIfError(error)
    return data as NotificationRow
  })
}
export function updateNotification(id: string, patch: Partial<Pick<NotificationRow, 'read_at' | 'title' | 'body' | 'target'>>): Promise<DbResult<NotificationRow>> {
  return execute(async () => {
    const userId = await ownerId()
    const { data, error } = await supabase.from('notifications').update(patch).eq('id', id).eq('user_id', userId).select('*').single()
    throwIfError(error)
    return data as NotificationRow
  })
}
export function deleteNotification(id: string): Promise<DbResult<null>> {
  return execute(async () => {
    const userId = await ownerId()
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId)
    throwIfError(error)
    return null
  })
}
