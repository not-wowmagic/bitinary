import assert from "node:assert/strict"

import { createServer } from "vite"

const server = await createServer({
  server: { middlewareMode: true },

  appType: "custom",

  optimizeDeps: { noDiscovery: true },
})

try {
  const {
    authLandingPath,
    authenticatedContinuationPath,
    isGoogleOnlyAccount,
    resolveAuthRole,
  } = await server.ssrLoadModule("/src/lib/authFlow.ts")

  assert.equal(isGoogleOnlyAccount(["google"]), true)
  assert.equal(isGoogleOnlyAccount(["email"]), false)
  assert.equal(isGoogleOnlyAccount(["google", "email"]), false)
  assert.equal(isGoogleOnlyAccount(undefined), false)

  assert.equal(
    resolveAuthRole({
      metadataRole: undefined,

      pendingRole: "business",

      intent: "signup",

      isAccountSwitch: true,

      pathname: "/auth",

      currentRole: "traveler",
    }),

    "business",

    "A new Business signup must keep its selected role through the provider redirect.",
  )

  assert.equal(
    resolveAuthRole({
      metadataRole: "business",

      pendingRole: "traveler",

      intent: "login",

      isAccountSwitch: true,

      pathname: "/auth",

      currentRole: "traveler",
    }),

    "business",

    "Existing account metadata must win over the pending signup role on login.",
  )

  assert.equal(
    resolveAuthRole({
      metadataRole: undefined,

      pendingRole: "business",

      intent: "login",

      isAccountSwitch: true,

      pathname: "/auth",

      currentRole: "traveler",
    }),

    "traveler",

    "A signup role must not change the role of an account being logged into.",
  )

  assert.equal(
    resolveAuthRole({
      metadataRole: undefined,

      pendingRole: null,

      intent: null,

      isAccountSwitch: true,

      pathname: "/biz/auth",

      currentRole: "traveler",
    }),

    "business",

    "An account entering through the business auth route should stay Business.",
  )

  assert.equal(
    authLandingPath("signup", "signup", "business"),
    "/biz/signup/name",
  )

  assert.equal(authLandingPath("signup", "signup", "traveler"), "/signup/name")

  assert.equal(authLandingPath("login", "login", "business"), "/biz/stats")

  assert.equal(authLandingPath("login", "login", "traveler"), "/")

  assert.equal(
    authenticatedContinuationPath("business", false, "/signup/name"),
    "/biz/signup/name",
  )
  assert.equal(
    authenticatedContinuationPath("business", false, "/biz/setup/summary"),
    "/biz/setup/summary",
  )
  assert.equal(
    authenticatedContinuationPath("business", true, "/signup/name"),
    "/biz",
  )
  assert.equal(
    authenticatedContinuationPath("traveler", false, "/signup/name"),
    "/signup/name",
  )

  console.log(
    "Passed auth role resolution, password-setting provider, and redirect checks.",
  )
} finally {
  await server.close()
}
