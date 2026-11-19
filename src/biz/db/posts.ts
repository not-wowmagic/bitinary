import type { Post } from "../seed"

import {
  createBusinessRow,
  deleteBusinessRow,
  loadBusinessRows,
  updateBusinessRow,
} from "./entity"

export type PostRow = {
  id: string
  business_id: string
  post_type: Post["type"]
  title: string | null
  body: string
  media_urls: string[]
  video_url: string | null
  status: Post["status"]
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  views: number
  likes: number
  saves: number
  comments_count: number
}

export const loadPosts = (businessId: string) =>
  loadBusinessRows<PostRow>("posts", businessId)

type PostWrite = Omit<
  PostRow,
  "id" | "business_id" | "created_at" | "views" | "likes" | "saves" | "comments_count"
> &
  Partial<Pick<PostRow, "views" | "likes" | "saves" | "comments_count">> & {
    created_at?: string
  }

export const createPost = (
  businessId: string,
  post: PostWrite,
) => createBusinessRow<PostRow>("posts", businessId, post)

export const updatePost = (
  businessId: string,
  id: string,
  patch: Partial<PostRow>,
) => updateBusinessRow<PostRow>("posts", businessId, id, patch)

export const deletePost = (businessId: string, id: string) =>
  deleteBusinessRow("posts", businessId, id)
