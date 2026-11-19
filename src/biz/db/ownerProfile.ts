import { supabase } from "@/lib/supabase"

import { execute, throwIfError, type DbResult } from "./result"

export type OwnerProfileFields = {
  name: string

  nickname: string

  mobile: string
}

export async function saveOwnerProfile(
  profile: OwnerProfileFields,
): Promise<DbResult<OwnerProfileFields>> {
  return execute(async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser()

    throwIfError(authError)

    if (!auth.user) throw new Error("Sign in before saving your owner profile.")

    const { data, error } = await supabase

      .from("profiles")

      .upsert({ id: auth.user.id, ...profile }, { onConflict: "id" })

      .select("name, nickname, mobile")

      .single()

    throwIfError(error)

    return data as OwnerProfileFields
  })
}
