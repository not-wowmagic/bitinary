import { emptyBusiness, type BusinessProfile, type Day } from "@/app/account"

import { normalizeBizType } from "@/data/themes"

import { supabase } from "@/lib/supabase"

import type { BizData } from "../store"

import type {
  Boost,
  Branch,
  Case,
  Comment,
  Deal,
  Notif,
  Post,
  ResRequest,
  Review,
  Staff,
} from "../seed"

import {
  loadBoosts,
  loadBranches,
  loadComments,
  loadDeals,
  loadHours,
  loadMenuItems,
  loadNotifications,
  loadOwnedBusiness,
  loadPhotos,
  loadPosts,
  loadReservations,
  loadReviewCases,
  loadReviews,
  loadStaff,
} from "./index"

import { execute, type DbResult } from "./result"

const DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

export async function loadOwnedWorkspace(): Promise<DbResult<BizData | null>> {
  return execute(async () => {
    const businessResult = await loadOwnedBusiness()

    if (businessResult.error) throw new Error(businessResult.error)

    if (!businessResult.data) return null

    const businessId = businessResult.data.id

    const [
      hoursResult,

      menuResult,

      photosResult,

      postsResult,

      commentsResult,

      reviewsResult,

      casesResult,

      dealsResult,

      boostsResult,

      branchesResult,

      staffResult,

      reservationsResult,

      notificationsResult,
    ] = await Promise.all([
      loadHours(businessId),

      loadMenuItems(businessId),

      loadPhotos(businessId),

      loadPosts(businessId),

      loadComments(businessId),

      loadReviews(businessId),

      loadReviewCases(businessId),

      loadDeals(businessId),

      loadBoosts(businessId),

      loadBranches(businessId),

      loadStaff(businessId),

      loadReservations(businessId),

      loadNotifications(),
    ])

    const results = [
      hoursResult,

      menuResult,

      photosResult,

      postsResult,

      commentsResult,

      reviewsResult,

      casesResult,

      dealsResult,

      boostsResult,

      branchesResult,

      staffResult,

      reservationsResult,

      notificationsResult,
    ]

    const failure = results.find((result) => result.error)

    if (failure?.error) throw new Error(failure.error)

    const hours = hoursResult.data ?? []

    const menu = menuResult.data ?? []

    const photos = photosResult.data ?? []

    const posts = postsResult.data ?? []

    const comments = commentsResult.data ?? []

    const reviews = reviewsResult.data ?? []

    const cases = casesResult.data ?? []

    const deals = dealsResult.data ?? []

    const boosts = boostsResult.data ?? []

    const branches = branchesResult.data ?? []

    const staff = staffResult.data ?? []

    const reservations = reservationsResult.data ?? []

    const notifications = notificationsResult.data ?? []

    const row = businessResult.data

    const hoursByDay = { ...emptyBusiness.hours }

    for (const hour of hours) {
      const day = DAYS[hour.day_of_week]

      if (day)
        hoursByDay[day] = {
          open: hour.opens_at?.slice(0, 5) ?? "",

          close: hour.closes_at?.slice(0, 5) ?? "",

          closed: hour.is_closed,

          allDay: hour.all_day,
        }
    }

    const profile: BusinessProfile = {
      ...emptyBusiness,

      id: row.id,

      status: row.setup_status ?? emptyBusiness.status,

      name: row.name,

      type: normalizeBizType(row.business_type),

      price: row.price_range ?? undefined,

      address: row.address,

      city: row.city,

      pin:
        row.latitude != null && row.longitude != null
          ? { lat: row.latitude, lng: row.longitude }
          : undefined,

      hours: hoursByDay,

      contactName: row.contact_name,

      mobile: row.mobile,

      landline: row.landline,

      about: row.about,

      specialties: row.specialties ?? [],

      languages: row.languages ?? [],

      goals: row.goals ?? [],

      cover:
        row.cover_url ??
        photos.find((photo) => photo.is_cover)?.storage_path ??
        undefined,

      photos: photos

        .filter((photo) => !photo.is_cover)

        .sort((a, b) => a.sort_order - b.sort_order)

        .map((photo) => photo.storage_path),

      menu: menu

        .sort((a, b) => a.sort_order - b.sort_order)

        .map((item) => ({
          id: item.id,

          name: item.name,

          price: String(item.price),

          category: item.category,
        })),

      logo: row.logo_url ?? undefined,

      links: row.links ?? emptyBusiness.links,

      verification: {
        method: row.verification_method ?? undefined,

        files: row.verification_files ?? [],

        onsiteDate: row.onsite_date ?? undefined,

        status: row.verification_status,
      },

      live: row.live,

      liveAt: row.live_at ?? undefined,
    }

    const asDate = (value: string | null, backup: string) => value ?? backup

    const mapPosts: Post[] = posts.map((post) => ({
      id: post.id,

      type: post.post_type,

      title: post.title ?? undefined,

      text: post.body,

      media: post.media_urls ?? [],

      video: post.video_url ?? undefined,

      status: post.status,

      at: asDate(post.published_at ?? post.scheduled_at, post.created_at),

      views: post.views,

      likes: post.likes,

      saves: post.saves,

      comments: post.comments_count,
    }))

    const mapComments: Comment[] = comments.map((comment) => ({
      id: comment.id,

      postId: comment.post_id,

      authorId: comment.author_id ?? undefined,

      nick: comment.author_id ?? "",

      text: comment.body,

      at: comment.created_at,

      hidden: comment.hidden,

      reported: comment.reported_reason ?? undefined,

      reply: comment.reply ?? undefined,

      blocked: comment.blocked,
    }))

    const mapReviews: Review[] = reviews.map((review) => ({
      id: review.id,

      nick: review.author_id ?? "",

      authorId: review.author_id ?? undefined,

      stars: review.stars,

      text: review.body,

      photos: review.photo_urls ?? [],

      at: review.created_at,

      checkin:
        review.checkin_at && review.checkin_via
          ? { at: review.checkin_at, via: review.checkin_via }
          : null,

      reply: review.reply ?? undefined,
    }))

    const mapCases: Case[] = cases.map((item) => ({
      id: item.id,

      reviewId: item.review_id,

      reason: item.reason,

      explanation: item.explanation,

      evidence: item.evidence_urls ?? [],

      status: item.status as Case["status"],

      createdAt: item.created_at,

      decidedAt: item.decided_at ?? undefined,

      timeline: Array.isArray(item.timeline)
        ? item.timeline as Case["timeline"]
        : [],

      messages: Array.isArray(item.messages)
        ? item.messages as Case["messages"]
        : [],
    }))

    const mapDeals: Deal[] = deals.map((deal) => ({
      id: deal.id,

      kind: deal.kind,

      item: deal.item,

      percent: deal.percent ?? undefined,

      minSpend: deal.min_spend ?? undefined,

      addon: deal.addon ?? undefined,

      start: deal.starts_at.slice(0, 10),

      end: deal.ends_at.slice(0, 10),

      from: deal.starts_at.slice(11, 16),

      to: deal.ends_at.slice(11, 16),

      limitPerDay: deal.limit_per_day,

      limitTotal: deal.limit_total,

      redemption: deal.redemption,

      code: deal.code,

      status: deal.status,

      redeemed: { qr: deal.redeemed_qr, code: deal.redeemed_code },

      views: deal.views,
    }))

    const mapBoosts: Boost[] = boosts.map((boost) => ({
      id: boost.id,

      postId: boost.post_id,

      budget: boost.budget,

      days: boost.days,

      target: boost.target,

      status: boost.status,

      start: boost.starts_at,

      results: { reach: boost.reach, clicks: boost.clicks, saves: boost.saves },
    }))

    const mapBranches: Branch[] = branches.map((branch) => ({
      id: branch.id,

      name: branch.name,

      area: branch.area,
    }))

    const mapStaff: Staff[] = staff.map((person) => ({
      id: person.email,

      name: person.name,

      email: person.email,

      role: person.role,

      status: person.status,

      branch: person.branch_id ?? "",
    }))

    const mapReservations: ResRequest[] = reservations.map((request) => ({
      id: request.id,

      nick: request.guest_name,

      party: request.party_size,

      at: request.requested_at,

      status: request.status,

      note: request.note ?? undefined,
    }))

    const mapNotifications: Notif[] = notifications.map((notification) => ({
      id: notification.id,

      kind: notification.kind as Notif["kind"],

      en: notification.title,

      tl: notification.title,

      at: notification.created_at,

      to: notification.target ?? "",

      read: notification.read_at != null,
    }))

    const auth = await supabase.auth.getUser()

    if (auth.error) throw new Error(auth.error.message)

    const user = auth.data.user
    if (!user)
      throw new Error("Sign in as the business owner to load profile data.")

    const ownerProfileResult = await supabase
      .from("profiles")
      .select("name, nickname, mobile")
      .eq("id", user.id)
      .maybeSingle()

    if (ownerProfileResult.error)
      throw new Error(ownerProfileResult.error.message)
    const ownerProfile = ownerProfileResult.data

    const data: BizData = {
      langPref: null,

      session: user
        ? {
            method: user.phone ? "mobile" : "email",

            contact: user.email ?? user.phone ?? "",
          }
        : null,

      resume: null,

      profile: {
        name:
          ownerProfile?.name ||
          String(
            user.user_metadata?.name ?? user.user_metadata?.full_name ?? "",
          ),

        nickname: ownerProfile?.nickname ?? "",

        email: user?.email ?? "",

        mobile: ownerProfile?.mobile || user?.phone || "",
      },

      business: profile,

      updated: {},

      quick: { state: "open", soldOut: false, longQueue: false, special: "" },

      branches: mapBranches,

      activeBranch: mapBranches[0]?.id ?? "",

      staff: mapStaff,

      posts: mapPosts,

      comments: mapComments,

      reviews: mapReviews,

      cases: mapCases,

      deals: mapDeals,

      boosts: mapBoosts,

      requests: mapReservations,

      reservations: { enabled: false, tables: 0, maxParty: 0, slot: 0 },

      queue: { open: false, waiting: 0 },

      notifs: mapNotifications,

      prefs: {
        jimbotMatch: false,

        channel: "notif",

        notif: {
          reviews: true,

          comments: true,

          reports: true,

          weekly: true,

          deals: true,
        },
      },

      qrToken: "",

      blocked: [],

      reportsUsed: 0,
    }

    return data
  })
}
