import type { BusinessProfile } from "@/app/account"

import { supabase } from "@/lib/supabase"

import { execute, throwIfError, type DbResult } from "./result"

export type BusinessRow = {
  id: string

  owner_id: string

  name: string

  business_type: string | null

  price_range: string | null

  address: string

  city: string

  latitude: number | null

  longitude: number | null

  contact_name: string

  mobile: string

  landline: string

  about: string

  specialties: string[]

  languages: string[]

  goals: string[]

  logo_url: string | null

  cover_url: string | null

  links: BusinessProfile["links"]

  live: boolean

  live_at: string | null

  verification_status: BusinessProfile["verification"]["status"]

  verification_method: BusinessProfile["verification"]["method"] | null

  verification_files: string[]

  onsite_date: string | null

  setup_status: BusinessProfile["status"]
}

export async function loadOwnedBusiness(): Promise<DbResult<BusinessRow | null>> {
  return execute(async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser()

    throwIfError(authError)

    if (!auth.user)
      throw new Error("Sign in as the business owner to load business data.")

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", auth.user.id)
      .maybeSingle()

    throwIfError(error)

    return data as BusinessRow | null
  })
}

export async function createBusiness(
  values: Omit<BusinessRow, "id" | "owner_id">,
): Promise<DbResult<BusinessRow>> {
  return execute(async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser()

    throwIfError(authError)

    if (!auth.user)
      throw new Error(
        "Sign in as the business owner before creating a business.",
      )

    const { data, error } = await supabase
      .from("businesses")
      .insert({ ...values, owner_id: auth.user.id })
      .select("*")
      .single()

    throwIfError(error)

    return data as BusinessRow
  })
}

export async function updateBusiness(
  id: string,
  values: Partial<BusinessRow>,
): Promise<DbResult<BusinessRow>> {
  return execute(async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser()

    throwIfError(authError)

    if (!auth.user)
      throw new Error(
        "Sign in as the business owner before updating a business.",
      )

    const { data, error } = await supabase
      .from("businesses")
      .update(values)
      .eq("id", id)
      .eq("owner_id", auth.user.id)
      .select("*")
      .single()

    throwIfError(error)

    return data as BusinessRow
  })
}

export async function deleteBusiness(id: string): Promise<DbResult<null>> {
  return execute(async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser()

    throwIfError(authError)

    if (!auth.user)
      throw new Error(
        "Sign in as the business owner before deleting a business.",
      )

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id)
      .eq("owner_id", auth.user.id)

    throwIfError(error)

    return null
  })
}
