export type AuthRole = "traveler" | "business"

export const AUTH_INTENT_KEY = "bitinary:auth-intent"

export const AUTH_ROLE_KEY = "bitinary:auth-role"

export function isGoogleOnlyAccount(providers: unknown): boolean {
  return Array.isArray(providers) && providers.includes("google") && !providers.includes("email")
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === "traveler" || value === "business"
}

export function resolveAuthRole({
  metadataRole,

  pendingRole,

  intent,

  isAccountSwitch,

  pathname,

  currentRole,
}: {
  metadataRole: unknown

  pendingRole: string | null

  intent: string | null

  isAccountSwitch: boolean

  pathname: string

  currentRole: AuthRole
}): AuthRole {
  if (isAuthRole(metadataRole)) return metadataRole

  if (intent === "signup" && isAuthRole(pendingRole)) return pendingRole

  if (isAccountSwitch)
    return pathname.startsWith("/biz") ? "business" : "traveler"

  return currentRole
}

export function authLandingPath(
  mode: "login" | "signup",
  intent: string | null,
  role: AuthRole,
): string {
  if (mode === "login" || intent === "login")
    return role === "business" ? "/biz/stats" : "/"

  return role === "business" ? "/biz/signup/name" : "/signup/name"
}

export function authenticatedContinuationPath(
  role: AuthRole,
  setupDone: boolean,
  resumePath?: string | null,
): string {
  if (setupDone) return role === "business" ? "/biz" : "/"

  if (role === "business") {
    return resumePath?.startsWith("/biz/") &&
      !resumePath.startsWith("/biz/auth")
      ? resumePath
      : "/biz/signup/name"
  }

  return resumePath ?? "/signup/name"
}
