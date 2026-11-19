import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

export type BizStats = {
  views: number[]
  saves: number[]
  trips: number[]
  checkins: number[]
  rating: number[]
  ratingAll: number
  reviewCount: number
  comments: number[]
  dealCustomers: number[]
  heat: number[][]
  sources: { search: number; jimbot: number; posts: number; reels: number }
  topSearches: { q: string; n: number; d: number; me: boolean }[]
  topics: { k: string; pos: number; n: number }[]
  loading: boolean
  isDatabaseBacked: boolean
  error: string | null
}

const D = 864e5

function zeroSeries(len = 60): number[] {
  return Array.from({ length: len }, () => 0)
}

export function buildZeroStats(error: string | null = null): BizStats {
  return {
    views: zeroSeries(60),
    saves: zeroSeries(60),
    trips: zeroSeries(60),
    checkins: zeroSeries(60),
    rating: [],
    ratingAll: 0,
    reviewCount: 0,
    comments: zeroSeries(60),
    dealCustomers: zeroSeries(60),
    heat: Array.from({ length: 7 }, () => zeroSeries(24)),
    sources: { search: 0, jimbot: 0, posts: 0, reels: 0 },
    topSearches: [],
    topics: [],
    loading: false,
    isDatabaseBacked: error === null,
    error,
  }
}

/** Fetches business analytics from persisted Supabase records. */
export async function fetchDatabaseStats(options: {
  businessId?: string
  live?: boolean
}): Promise<BizStats> {
  if (!options.live) {
    return buildZeroStats()
  }

  try {
    const bizId = options.businessId
    if (!bizId) {
      return buildZeroStats('This business has not been saved to the database yet.')
    }

    const [reviewsRes, dailyRes] = await Promise.all([
      supabase.from('reviews').select('id, stars, visited, checkin_at, created_at').eq('business_id', bizId),
      supabase.from('business_daily_stats').select('stat_date, views, saves, trip_adds, checkins, deal_customers').eq('business_id', bizId),
    ])
    if (reviewsRes.error) throw reviewsRes.error
    if (dailyRes.error) throw dailyRes.error

    const now = Date.now()
    const views = zeroSeries(60)
    const saves = zeroSeries(60)
    const trips = zeroSeries(60)
    const checkins = zeroSeries(60)
    const comments = zeroSeries(60)
    const dealCustomers = zeroSeries(60)
    const reviewsData = reviewsRes.data ?? []
    const reviewCount = reviewsData.length
    const totalStars = reviewsData.reduce((acc, r) => acc + (Number(r.stars) || 0), 0)
    const ratingAll = reviewCount > 0 ? Number((totalStars / reviewCount).toFixed(1)) : 0

    const sortedReviews = [...reviewsData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const ratingHistory: number[] = []
    let rollingSum = 0
    sortedReviews.forEach((r, idx) => {
      rollingSum += Number(r.stars) || 0
      ratingHistory.push(Number((rollingSum / (idx + 1)).toFixed(1)))
    })

    for (const r of reviewsData) {
      if (r.visited || r.checkin_at) {
        const dateVal = r.checkin_at || r.created_at
        const daysAgo = Math.floor((now - new Date(dateVal).getTime()) / D)
        if (daysAgo >= 0 && daysAgo < 60) {
          checkins[59 - daysAgo]++
        }
      }
    }

    const heat = Array.from({ length: 7 }, () => zeroSeries(24))
    for (const r of reviewsData) {
      if (!r.visited && !r.checkin_at) continue
      const date = new Date(r.checkin_at || r.created_at)
      heat[(date.getDay() + 6) % 7][date.getHours()]++
    }

    const dailyData = dailyRes.data ?? []
    for (const d of dailyData) {
      const daysAgo = Math.floor((now - new Date(d.stat_date).getTime()) / D)
      if (daysAgo >= 0 && daysAgo < 60) {
        const i = 59 - daysAgo
        views[i] = Math.max(views[i], Number(d.views) || 0)
        saves[i] = Math.max(saves[i], Number(d.saves) || 0)
        trips[i] = Math.max(trips[i], Number(d.trip_adds) || 0)
        checkins[i] = Math.max(checkins[i], Number(d.checkins) || 0)
        dealCustomers[i] = Math.max(dealCustomers[i], Number(d.deal_customers) || 0)
      }
    }

    const finalRatingSeries = ratingHistory.length >= 8 ? ratingHistory.slice(-8) : ratingHistory.length > 0 ? ratingHistory : (ratingAll > 0 ? [ratingAll] : [])

    return {
      views,
      saves,
      trips,
      checkins,
      rating: finalRatingSeries,
      ratingAll,
      reviewCount,
      comments,
      dealCustomers,
      heat,
      sources: { search: 0, jimbot: 0, posts: 0, reels: 0 },
      topSearches: [],
      topics: [],
      loading: false,
      isDatabaseBacked: true,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load business analytics.'
    return buildZeroStats(message)
  }
}

/**
 * Hook to read reactive statistics from the database.
 */
export function useBizStats(options?: {
  businessId?: string
  live?: boolean
}): BizStats & { refresh: () => void } {
  const [stats, setStats] = useState<BizStats>(() => ({ ...buildZeroStats(), loading: true }))

  const live = options?.live
  const bizId = options?.businessId

  const refresh = useCallback(async () => {
    const next = await fetchDatabaseStats({
      businessId: bizId,
      live,
    })
    setStats(next)
  }, [bizId, live])

  useEffect(() => {
    let active = true
    const loadStats = () => {
      void fetchDatabaseStats({
        businessId: bizId,
        live,
      }).then((res) => {
        if (active) setStats(res)
      })
    }

    loadStats()
    const channel =
      live && bizId
        ? supabase
            .channel(`business-daily-stats-${bizId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'business_daily_stats',
                filter: `business_id=eq.${bizId}`,
              },
              loadStats,
            )
            .subscribe((status) => {
              if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error(`Live business statistics subscription failed: ${status}`)
              }
            })
        : null

    return () => {
      active = false
      if (channel) void supabase.removeChannel(channel)
    }
  }, [bizId, live])

  return useMemo(() => ({ ...stats, refresh }), [stats, refresh])
}
