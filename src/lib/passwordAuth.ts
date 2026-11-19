import { authRedirectUrl } from "@/lib/authRedirectUrl"

import { AUTH_INTENT_KEY, AUTH_ROLE_KEY, type AuthRole } from "@/lib/authFlow"

import { supabase } from "@/lib/supabase"

type AuthMode = "login" | "signup"

function setIntent(mode: AuthMode, role?: AuthRole) {
  sessionStorage.setItem(AUTH_INTENT_KEY, mode)

  if (mode === "signup" && role) sessionStorage.setItem(AUTH_ROLE_KEY, role)
  else sessionStorage.removeItem(AUTH_ROLE_KEY)
}

function clearIntent() {
  sessionStorage.removeItem(AUTH_INTENT_KEY)

  sessionStorage.removeItem(AUTH_ROLE_KEY)
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
  captchaToken?: string,
) {
  setIntent("login")

  const { data, error } = await supabase.auth.signInWithPassword({
    email,

    password,

    options: captchaToken ? { captchaToken } : undefined,
  })

  if (error) {
    clearIntent()

    return { error: error.message, user: null, hasSession: false }
  }

  return { error: null, user: data.user, hasSession: !!data.session }
}

export async function signUpWithEmailPassword(
  email: string,

  password: string,

  role: AuthRole,

  callbackPath: string,

  captchaToken?: string,
) {
  setIntent("signup", role)

  const { data, error } = await supabase.auth.signUp({
    email,

    password,

    options: {
      data: { role },

      emailRedirectTo: authRedirectUrl(callbackPath, {
        mode: "signup",
        to: email,
      }),

      ...(captchaToken ? { captchaToken } : {}),
    },
  })

  if (error) {
    clearIntent()

    return { error: error.message, hasSession: false, user: null }
  }

  return { error: null, hasSession: !!data.session, user: data.user }
}

export async function resendSignupConfirmation(
  email: string,
  captchaToken?: string,
) {
  const { error } = await supabase.auth.resend({
    type: "signup",

    email,

    options: captchaToken ? { captchaToken } : undefined,
  })

  return { error: error?.message ?? null }
}

export async function requestPasswordRecovery(
  email: string,
  callbackPath: string,
  captchaToken?: string,
) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectUrl(callbackPath),

    ...(captchaToken ? { captchaToken } : {}),
  })

  return { error: error?.message ?? null }
}

export async function updatePassword(
  password: string,
  currentPassword?: string,
) {
  if (currentPassword) {
    const { data, error: userError } = await supabase.auth.getUser()

    if (userError) return { error: userError.message }

    if (!data.user?.email)
      return { error: "Could not verify the current account email." }

    const { data: verified, error } = await supabase.auth.signInWithPassword({
      email: data.user.email,

      password: currentPassword,
    })

    if (error) return { error: error.message }

    if (verified.user.id !== data.user.id)
      return { error: "The current password did not match this account." }
  }

  const { error } = await supabase.auth.updateUser({ password })

  return { error: error?.message ?? null }
}
