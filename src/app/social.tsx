import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import type { Post as BizPost } from '@/biz/seed'
import type { BizData } from '@/biz/store'
import { seedFeedComments, seedFeedPosts, seedFeedReviews, type FeedComment, type FeedPost, type FeedReview } from '@/data/feed'
import { LINKED_PLACE_ID, placeById } from '@/data/places'
import { readStored, usePersistentState } from '@/lib/usePersistentState'
import { useAccount } from './account'
import { useBizSnapshot, writeBiz } from './bizBridge'

/** Travelers' own reviews and comments for places without a business account, plus likes everywhere. */
type SocialData = { reviews: FeedReview[]; comments: FeedComment[]; liked: string[] }
const empty: SocialData = { reviews: [], comments: [], liked: [] }

type Ctx = { data: SocialData; set: (fn: (d: SocialData) => SocialData) => boolean }
const C = createContext<Ctx | null>(null)

export function SocialProvider({ children }: { children: ReactNode }) {
  const [data, setData] = usePersistentState<SocialData>('social', empty)
  const set = useCallback(
    (fn: (d: SocialData) => SocialData) => {
      const next = fn(readStored('social', data))
      // Write once up front so a full storage (photo reviews) can be reported instead of silently lost.
      try {
        localStorage.setItem('bitinary:social', JSON.stringify(next))
      } catch {
        return false
      }
      setData(next)
      return true
    },
    [data, setData],
  )
  return <C.Provider value={{ data, set }}>{children}</C.Provider>
}

function useSocial() {
  const c = useContext(C)
  if (!c) throw new Error('useSocial outside SocialProvider')
  return c
}

/** Raw traveler social data for the developer console. */
export function useSocialData() {
  return useSocial()
}

export type ReviewInput = { stars: number; text: string; photos: string[]; visited: boolean }

function mapBizPost(p: BizPost, placeId: string, d: BizData): FeedPost {
  const deal = p.dealId ? d.deals.find((x) => x.id === p.dealId) : undefined
  const boosted = d.boosts.some((b) => b.postId === p.id && b.status === 'active')
  const kind = p.type === 'reel' ? 'video' : p.type === 'blog' ? 'blog' : deal || boosted ? 'ad' : 'photo'
  return {
    id: p.id,
    placeId,
    kind,
    title: p.title,
    text: p.text,
    media: p.media,
    at: p.at,
    likes: p.likes,
    comments: p.comments,
    ad: kind === 'ad' ? { cta: 'Kunin ang deal', until: deal ? `Hanggang ${new Date(deal.end).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })}` : 'Ngayong linggo' } : undefined,
  }
}

const byNewest = <T extends { at: string }>(a: T, b: T) => b.at.localeCompare(a.at)

/**
 * Everything a business profile needs. For the linked demo place the source of truth is the
 * Bitinary Business store, so the owner sees (and answers) what travelers write.
 */
export function useBusinessFeed(placeId: string) {
  const { session, profile } = useAccount()
  const { data, set } = useSocial()
  const biz = useBizSnapshot()
  const place = placeById(placeId)
  const linked = placeId === LINKED_PLACE_ID
  const me = session?.kind === 'user' ? session.accountId : undefined
  const nick = profile.nickname || profile.name.split(' ')[0] || 'Biyahero'

  const posts = useMemo<FeedPost[]>(() => (linked ? biz.posts.filter((p) => p.status === 'published').map((p) => mapBizPost(p, placeId, biz)).sort(byNewest) : (seedFeedPosts[placeId] ?? [])), [linked, biz, placeId])
  const postIds = useMemo(() => new Set(posts.map((p) => p.id)), [posts])

  const comments = useMemo<FeedComment[]>(() => {
    const all: FeedComment[] = linked
      ? biz.comments.filter((c) => !c.blocked).map((c) => ({ id: c.id, postId: c.postId, nick: c.nick, authorId: c.authorId, text: c.text, at: c.at, reply: c.reply, hidden: c.hidden }))
      : [...data.comments.filter((c) => postIds.has(c.postId)), ...seedFeedComments.filter((c) => postIds.has(c.postId))]
    // Owner-hidden comments stay visible only to the person who wrote them.
    return all.filter((c) => !c.hidden || (me && c.authorId === me)).sort((a, b) => a.at.localeCompare(b.at))
  }, [linked, biz.comments, data.comments, postIds, me])

  const reviews = useMemo<FeedReview[]>(() => {
    const list: FeedReview[] = linked
      ? biz.reviews.filter((r) => !r.caseId).map((r) => ({ id: r.id, placeId, nick: r.nick, authorId: r.authorId, stars: r.stars, text: r.text, photos: r.photos, at: r.at, visited: !!r.checkin, reply: r.reply }))
      : [...data.reviews.filter((r) => r.placeId === placeId), ...(seedFeedReviews[placeId] ?? [])]
    return list.sort(byNewest)
  }, [linked, biz.reviews, data.reviews, placeId])

  const myReview = me ? reviews.find((r) => r.authorId === me) : undefined
  const own = reviews.filter((r) => r.authorId)
  const baseCount = place?.reviews ?? 0
  const reviewCount = baseCount + own.length
  const rating = reviewCount ? Math.round((((place?.rating ?? 0) * baseCount + own.reduce((a, r) => a + r.stars, 0)) / reviewCount) * 10) / 10 : 0

  const commentsFor = useCallback((postId: string) => comments.filter((c) => c.postId === postId), [comments])

  const saveReview = (input: ReviewInput): string | false => {
    if (!me) return false
    const now = new Date().toISOString()
    const id = myReview?.id ?? `rv-${Date.now()}`
    if (linked) {
      const ok = writeBiz((d) => {
        const exists = d.reviews.some((r) => r.id === id)
        const review = { id, nick, authorId: me, stars: input.stars, text: input.text, photos: input.photos, at: now, checkin: input.visited ? { at: now, via: 'code' as const } : null, fresh: true }
        return {
          ...d,
          reviews: exists ? d.reviews.map((r) => (r.id === id ? { ...r, ...review } : r)) : [review, ...d.reviews],
          notifs: [{ id: `n-${Date.now()}`, kind: 'review' as const, at: now, to: `/biz/content/reviews/${id}`, tl: `${exists ? 'In-edit ni' : 'Bagong'} ${input.stars}★ review mula kay ${nick}`, en: exists ? `${nick} edited their ${input.stars}★ review` : `New ${input.stars}★ review from ${nick}` }, ...d.notifs],
        }
      })
      return ok && id
    }
    const review: FeedReview = { id, placeId, nick, authorId: me, at: now, fresh: true, ...input }
    const ok = set((d) => ({ ...d, reviews: d.reviews.some((r) => r.id === id) ? d.reviews.map((r) => (r.id === id ? review : r)) : [review, ...d.reviews] }))
    return ok && id
  }

  const deleteReview = (id: string) => (linked ? writeBiz((d) => ({ ...d, reviews: d.reviews.filter((r) => r.id !== id || r.authorId !== me) })) : set((d) => ({ ...d, reviews: d.reviews.filter((r) => r.id !== id) })))

  const addComment = (postId: string, text: string) => {
    if (!me) return false
    const c = { id: `cm-${Date.now()}`, postId, nick, authorId: me, text, at: new Date().toISOString() }
    if (linked) {
      return writeBiz((d) => ({
        ...d,
        comments: [{ ...c, fresh: true }, ...d.comments],
        posts: d.posts.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)),
        notifs: [{ id: `n-${Date.now()}`, kind: 'comment' as const, at: c.at, to: '/biz/content/comments', tl: `Nag-comment si ${nick}: "${text.slice(0, 40)}"`, en: `${nick} commented: "${text.slice(0, 40)}"` }, ...d.notifs],
      }))
    }
    return set((d) => ({ ...d, comments: [...d.comments, c] }))
  }

  const deleteComment = (id: string) =>
    linked
      ? writeBiz((d) => {
          const c = d.comments.find((x) => x.id === id && x.authorId === me)
          return c ? { ...d, comments: d.comments.filter((x) => x.id !== id), posts: d.posts.map((p) => (p.id === c.postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p)) } : d
        })
      : set((d) => ({ ...d, comments: d.comments.filter((x) => x.id !== id) }))

  const isLiked = (postId: string) => data.liked.includes(`${placeId}:${postId}`)
  const toggleLike = (postId: string) => {
    const k = `${placeId}:${postId}`
    set((d) => ({ ...d, liked: d.liked.includes(k) ? d.liked.filter((x) => x !== k) : [...d.liked, k] }))
  }

  return { linked, posts, reviews, myReview, me, nick, commentsFor, saveReview, deleteReview, addComment, deleteComment, isLiked, toggleLike, stats: { rating, reviewCount }, menu: linked ? biz.business.menu : null }
}

export type BusinessFeed = ReturnType<typeof useBusinessFeed>
