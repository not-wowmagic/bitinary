import { useEffect, useMemo, useState } from 'react'
import { useConsole, type Removed } from '@/app/console'
import { useStore } from '@/app/store'
import { supabase } from '@/lib/supabase'

const USERS_UPDATED = 'bitinary:console-users-updated'
const MODERATION_UPDATED = 'bitinary:console-moderation-updated'

export type ConsoleUser = {
  id: string
  name: string
  email?: string
  mobile?: string
  role: 'traveler' | 'business'
  method: 'google' | 'mobile' | 'email'
  source: 'database'
  city?: string
  joined: string
  lastActive: string
  reviews: number
  comments: number
  suspended: boolean
}

/** User records are loaded from Supabase Auth and profiles, never from local demo accounts. */
export function useConsoleUsers() {
  const [records, setRecords] = useState<Omit<ConsoleUser, 'suspended' | 'source'>[]>([])
  const [loading, setLoading] = useState(true)
  const { c } = useConsole()
  const { showToast } = useStore()

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase.rpc('get_dev_console_users')
      if (!active) return
      if (error) {
        setLoading(false)
        showToast({ text: `Could not load database users: ${error.message}`, expression: 'unsure' })
        return
      }
      setRecords((Array.isArray(data) ? data : []).map((row) => ({
        id: row.id,
        name: row.name || row.email || 'Unnamed user',
        email: row.email ?? undefined,
        mobile: row.mobile ?? undefined,
        role: row.role === 'business' ? 'business' : 'traveler',
        method: row.method === 'google' || row.method === 'mobile' ? row.method : 'email',
        city: row.city ?? undefined,
        joined: row.joined,
        lastActive: row.lastActive ?? row.joined,
        reviews: Number(row.reviews ?? 0),
        comments: Number(row.comments ?? 0),
      })))
      setLoading(false)
    }
    const refresh = () => { void load() }
    void load()
    window.addEventListener(USERS_UPDATED, refresh)
    return () => {
      active = false
      window.removeEventListener(USERS_UPDATED, refresh)
    }
  }, [showToast])

  const users = useMemo(() => {
    return records.map((user) => ({
      ...user,
      source: 'database' as const,
      suspended: c.suspended.includes(user.id),
    }))
  }, [records, c.suspended])
  return { users, loading }
}

/* ------------------------------ Moderation ------------------------------ */

export type ModItem = { id: string; kind: 'review' | 'comment'; placeId: string; placeName: string; nick: string; authorId?: string; text: string; stars?: number; photos: string[]; at: string; source: 'traveler' | 'biz'; removed?: Removed; flags: string[] }

const BAD = /\b(scam|gago|tanga|bobo|putang|bwisit)\b/i
export function flagsFor(text: string) {
  const f: string[] = []
  if (/(https?:\/\/|www\.|bit\.ly|\.com\b)/i.test(text)) f.push('Link')
  const letters = text.replace(/[^a-z]/gi, '')
  if (letters.length > 12 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) f.push('All caps')
  if (BAD.test(text)) f.push('Language')
  if (/(\d[\s-]?){10,}/.test(text) || /@\w+\.\w+/.test(text)) f.push('Personal info')
  return f
}

export function useModeration(): ModItem[] {
  const [records, setRecords] = useState<ModItem[]>([])
  const { c } = useConsole()
  const { showToast } = useStore()

  useEffect(() => {
    let active = true
    const load = async () => {
      const [reviews, comments] = await Promise.all([
        supabase.from('reviews').select('id,business_id,author_id,stars,body,photo_urls,created_at,hidden,business:businesses(name),author:profiles(name,nickname)').order('created_at', { ascending: false }),
        supabase.from('comments').select('id,post_id,author_id,body,hidden,reported_reason,created_at,post:posts(business_id,business:businesses(name)),author:profiles(name,nickname)').order('created_at', { ascending: false }),
      ])
      if (!active) return
      const error = reviews.error ?? comments.error
      if (error) {
        showToast({ text: `Could not load database moderation records: ${error.message}`, expression: 'unsure' })
        return
      }
      const profileName = (author: { name?: string; nickname?: string } | null) =>
        author?.nickname || author?.name || 'Unknown user'
      const reviewRows: ModItem[] = (reviews.data ?? []).map((row) => {
        const business = row.business as { name?: string } | null
        const author = row.author as { name?: string; nickname?: string } | null
        return {
          id: row.id,
          kind: 'review',
          placeId: row.business_id,
          placeName: business?.name || 'Unknown business',
          nick: profileName(author),
          authorId: row.author_id ?? undefined,
          text: row.body,
          stars: row.stars,
          photos: row.photo_urls ?? [],
          at: row.created_at,
          source: row.author_id ? 'traveler' : 'biz',
          removed: row.hidden ? { id: row.id, kind: 'review', reason: 'Hidden by moderator', at: row.created_at } : undefined,
          flags: flagsFor(row.body),
        }
      })
      const commentRows: ModItem[] = (comments.data ?? []).map((row) => {
        const post = row.post as { business_id?: string; business?: { name?: string } | null } | null
        const author = row.author as { name?: string; nickname?: string } | null
        return {
          id: row.id,
          kind: 'comment',
          placeId: post?.business_id ?? '',
          placeName: post?.business?.name || 'Unknown business',
          nick: profileName(author),
          authorId: row.author_id ?? undefined,
          text: row.body,
          photos: [],
          at: row.created_at,
          source: row.author_id ? 'traveler' : 'biz',
          removed: row.hidden ? { id: row.id, kind: 'comment', reason: row.reported_reason || 'Hidden by moderator', at: row.created_at } : undefined,
          flags: flagsFor(row.body),
        }
      })
      setRecords([...reviewRows, ...commentRows].sort((a, b) => b.at.localeCompare(a.at)))
    }
    const refresh = () => { void load() }
    void load()
    window.addEventListener(MODERATION_UPDATED, refresh)
    return () => {
      active = false
      window.removeEventListener(MODERATION_UPDATED, refresh)
    }
  }, [showToast])

  return useMemo(() => {
    const rm = new Map(c.removed.map((r) => [r.id, r]))
    return records.map((item) => ({
      ...item,
      removed: item.removed ?? rm.get(item.id),
    }))
  }, [records, c.removed])
}

export function refreshConsoleUsers() {
  window.dispatchEvent(new Event(USERS_UPDATED))
}

export function refreshModeration() {
  window.dispatchEvent(new Event(MODERATION_UPDATED))
}

/* ------------------------------ Storage ------------------------------ */

export const STORAGE_BUDGET = 5 * 1024 * 1024
export function storageUsage() {
  const keys: { key: string; bytes: number }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('bitinary:')) continue
    keys.push({ key: k.replace('bitinary:', ''), bytes: (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2 })
  }
  keys.sort((a, b) => b.bytes - a.bytes)
  return { keys, total: keys.reduce((a, k) => a + k.bytes, 0) }
}
export const kb = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
export function fmtRel(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  if (s < 30 * 86400) return `${Math.round(s / 86400)} d ago`
  return fmtDate(iso)
}
