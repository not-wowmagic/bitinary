import { useMemo } from 'react'
import { useAccount } from '@/app/account'
import { useBizSnapshot } from '@/app/bizBridge'
import { BIZ_OWNER_ID, useConsole, type Removed } from '@/app/console'
import { useSocialData } from '@/app/social'
import { sampleUsers } from '@/data/devUsers'
import { seedFeedComments, seedFeedPosts, seedFeedReviews } from '@/data/feed'
import { LINKED_PLACE_ID, placeById } from '@/data/places'

const D = 864e5
const ago = (days: number) => new Date(Date.now() - days * D).toISOString()

export type ConsoleUser = {
  id: string
  name: string
  email?: string
  mobile?: string
  role: 'traveler' | 'business'
  method: 'google' | 'mobile' | 'email'
  source: 'device' | 'sample' | 'biz'
  city?: string
  joined: string
  lastActive: string
  reviews: number
  comments: number
  suspended: boolean
  current: boolean
}

/** Every user the console knows about: device accounts, the /biz owner on this device, and sample users. */
export function useConsoleUsers(): ConsoleUser[] {
  const acc = useAccount()
  const biz = useBizSnapshot()
  const { data } = useSocialData()
  const { c } = useConsole()
  return useMemo(() => {
    const count = (id: string) => ({
      reviews: data.reviews.filter((r) => r.authorId === id).length + biz.reviews.filter((r) => r.authorId === id).length,
      comments: data.comments.filter((r) => r.authorId === id).length + biz.comments.filter((r) => r.authorId === id).length,
    })
    const device: ConsoleUser[] = acc.accounts.map((a) => {
      const ms = Number(a.id.replace('acc-', ''))
      const joined = Number.isFinite(ms) && ms > 1e12 ? new Date(ms).toISOString() : ago(240)
      const current = acc.session?.accountId === a.id
      return {
        id: a.id,
        name: a.name || (current ? acc.profile.name : '') || 'No name yet',
        email: a.email ?? a.google,
        mobile: a.mobile,
        role: a.role,
        method: current && acc.session?.method ? acc.session.method : a.google ? 'google' : a.mobile ? 'mobile' : 'email',
        source: 'device',
        city: current ? acc.profile.city : undefined,
        joined,
        lastActive: current ? new Date().toISOString() : joined,
        ...count(a.id),
        suspended: c.suspended.includes(a.id),
        current,
      }
    })
    const owner: ConsoleUser[] = biz.session
      ? [{ id: BIZ_OWNER_ID, name: biz.profile.name || 'Business owner', email: biz.profile.email || undefined, mobile: biz.profile.mobile || undefined, role: 'business', method: biz.session.method, source: 'biz', city: biz.business.city || undefined, joined: ago(45), lastActive: new Date().toISOString(), reviews: 0, comments: biz.comments.filter((x) => x.reply).length, suspended: c.suspended.includes(BIZ_OWNER_ID), current: true }]
      : []
    const samples: ConsoleUser[] = sampleUsers.map((s) => ({ ...s, source: 'sample', joined: ago(s.joinedDaysAgo), lastActive: ago(s.activeDaysAgo), suspended: c.suspended.includes(s.id), current: false }))
    return [...device, ...owner, ...samples]
  }, [acc.accounts, acc.session, acc.profile, biz, data, c.suspended])
}

/* ------------------------------ Moderation ------------------------------ */

export type ModItem = { id: string; kind: 'review' | 'comment'; placeId: string; placeName: string; nick: string; authorId?: string; text: string; stars?: number; photos: string[]; at: string; source: 'traveler' | 'sample' | 'biz'; removed?: Removed; flags: string[] }

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

const placeOfPost = (postId: string) => Object.keys(seedFeedPosts).find((pid) => seedFeedPosts[pid].some((p) => p.id === postId)) ?? LINKED_PLACE_ID

export function useModeration(): ModItem[] {
  const biz = useBizSnapshot()
  const { data } = useSocialData()
  const { c } = useConsole()
  return useMemo(() => {
    const rm = new Map(c.removed.map((r) => [r.id, r]))
    const name = (id: string) => placeById(id)?.name ?? id
    const items: ModItem[] = [
      ...data.reviews.map((r) => ({ id: r.id, kind: 'review' as const, placeId: r.placeId, nick: r.nick, authorId: r.authorId, text: r.text, stars: r.stars, photos: r.photos, at: r.at, source: 'traveler' as const })),
      ...data.comments.map((x) => ({ id: x.id, kind: 'comment' as const, placeId: placeOfPost(x.postId), nick: x.nick, authorId: x.authorId, text: x.text, photos: [], at: x.at, source: 'traveler' as const })),
      ...biz.reviews.filter((r) => !r.caseId).map((r) => ({ id: r.id, kind: 'review' as const, placeId: LINKED_PLACE_ID, nick: r.nick, authorId: r.authorId, text: r.text, stars: r.stars, photos: r.photos, at: r.at, source: (r.authorId ? 'traveler' : 'biz') as 'traveler' | 'biz' })),
      ...biz.comments.filter((x) => !x.blocked).map((x) => ({ id: x.id, kind: 'comment' as const, placeId: LINKED_PLACE_ID, nick: x.nick, authorId: x.authorId, text: x.text, photos: [], at: x.at, source: (x.authorId ? 'traveler' : 'biz') as 'traveler' | 'biz' })),
      ...Object.values(seedFeedReviews).flat().map((r) => ({ id: r.id, kind: 'review' as const, placeId: r.placeId, nick: r.nick, text: r.text, stars: r.stars, photos: r.photos, at: r.at, source: 'sample' as const })),
      ...seedFeedComments.map((x) => ({ id: x.id, kind: 'comment' as const, placeId: placeOfPost(x.postId), nick: x.nick, text: x.text, photos: [], at: x.at, source: 'sample' as const })),
    ].map((x) => ({ ...x, placeName: name(x.placeId), removed: rm.get(x.id), flags: flagsFor(x.text) }))
    return items.sort((a, b) => b.at.localeCompare(a.at))
  }, [biz, data, c.removed])
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
