import { useEffect, useRef, useState } from "react"

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

import { useLocation, useNavigate } from "react-router"

import { Button } from "@/components/ui/Button"

import { PasswordField, TextField } from "@/components/flow/Fields"

import { AUTH_INTENT_KEY, AUTH_ROLE_KEY } from "@/lib/authFlow"
import { requestPasswordRecovery } from "@/lib/passwordAuth"
import { supabase } from "@/lib/supabase"
import { turnstileSiteKey } from "@/lib/turnstile"
import { useOnline } from "@/lib/useOnline"

type Translate = (tagalog: string, english: string) => string

export function PasswordRecoveryPage({
  business,
  t,
}: {
  business: boolean
  t: Translate
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const online = useOnline()

  const callbackPath = business ? "biz/auth/recovery" : "auth/recovery"

  const recoveryLink =
    new URLSearchParams(location.hash.slice(1)).get("type") === "recovery" ||
    sessionStorage.getItem("bitinary:password-recovery") === "true"

  const [email, setEmail] = useState(
    () => new URLSearchParams(location.search).get("email") ?? "",
  )

  const [password, setPassword] = useState("")

  const [confirmPassword, setConfirmPassword] = useState("")

  const [recoveryReady, setRecoveryReady] = useState(false)

  const [checking, setChecking] = useState(recoveryLink)

  const [busy, setBusy] = useState(false)

  const [captchaToken, setCaptchaToken] = useState<string>()

  const [message, setMessage] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const captchaRef = useRef<TurnstileInstance | null>(null)

  useEffect(() => {
    if (!recoveryLink) return

    let active = true

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session && active) {
          sessionStorage.setItem("bitinary:password-recovery", "true")

          setRecoveryReady(true)

          setChecking(false)
        }
      },
    )

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return

        if (sessionError) setError(sessionError.message)

        const hasRecoverySession =
          sessionStorage.getItem("bitinary:password-recovery") === "true" &&
          !!data.session
        if (!data.session)
          sessionStorage.removeItem("bitinary:password-recovery")

        setRecoveryReady(hasRecoverySession)

        setChecking(false)
      })
      .catch((sessionError: unknown) => {
        if (!active) return
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Could not verify the password reset link.",
        )
        setChecking(false)
      })

    return () => {
      active = false

      listener.subscription.unsubscribe()
    }
  }, [recoveryLink])

  const requestReset = async () => {
    const address = email.trim().toLowerCase()

    if (!address)
      return setError(t("Ilagay ang email mo.", "Enter your email address."))

    setBusy(true)

    setError(null)

    try {
      const result = await requestPasswordRecovery(
        address,
        callbackPath,
        captchaToken,
      )

      if (result.error) {
        setError(result.error)

        return
      }

      setMessage(
        t(
          "Kung may account ang email na ito, magpapadala kami ng link para magtakda ng bagong password.",

          "If an account exists for this email, we will send a link to set a new password.",
        ),
      )
    } catch (resetError: unknown) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Could not request a password reset.",
      )
    } finally {
      setBusy(false)

      captchaRef.current?.reset()

      setCaptchaToken(undefined)
    }
  }

  const savePassword = async () => {
    if (password.length < 8)
      return setError(
        t(
          "Gumamit ng hindi bababa sa 8 character.",
          "Use at least 8 characters.",
        ),
      )

    if (password !== confirmPassword)
      return setError(
        t("Hindi magkapareho ang password.", "Passwords do not match."),
      )

    setBusy(true)

    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)

        return
      }

      sessionStorage.removeItem("bitinary:password-recovery")

      sessionStorage.setItem(AUTH_INTENT_KEY, "login")

      sessionStorage.removeItem(AUTH_ROLE_KEY)

      setMessage(
        t("Na-update na ang password mo.", "Your password has been updated."),
      )

      navigate(business ? "/biz/auth?mode=login" : "/auth?mode=login", {
        replace: true,
      })
    } catch (updateError: unknown) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update the password.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-10 text-fg">
      <section className="w-full max-w-md rounded-[28px] bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-h2">
          {recoveryLink
            ? t("Magtakda ng bagong password", "Set a new password")
            : t("I-reset ang password", "Reset your password")}
        </h1>
        <p className="mt-2 text-body text-fg-2">
          {recoveryLink
            ? t(
                "Pumili ng bagong password para sa account mo.",
                "Choose a new password for your account.",
              )
            : t(
                "Ilagay ang email na ginamit mo sa account.",
                "Enter the email address for your account.",
              )}
        </p>

        {checking ? (
          <p role="status" className="mt-5 text-body text-fg-2">
            {t("Sinusuri ang reset link…", "Checking reset link…")}
          </p>
        ) : recoveryLink && !recoveryReady ? (
          <div className="mt-5 space-y-4">
            {(error || !message) && (
              <p role="alert" className="text-body text-danger">
                {error ??
                  t(
                    "Hindi valid o expired ang reset link.",
                    "This reset link is invalid or expired.",
                  )}
              </p>
            )}
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => (
                setEmail(event.target.value), setError(null), setMessage(null)
              )}
            />
            {turnstileSiteKey && (
              <Turnstile
                ref={captchaRef}
                siteKey={turnstileSiteKey}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken(undefined)}
                onError={() => setCaptchaToken(undefined)}
              />
            )}
            {message && (
              <p role="status" className="text-caption text-fg-2">
                {message}
              </p>
            )}
            <Button
              block
              disabled={
                busy ||
                !online ||
                !email.trim() ||
                (!!turnstileSiteKey && !captchaToken)
              }
              onClick={() => void requestReset()}
            >
              {t("Magpadala ng bagong reset link", "Send a new reset link")}
            </Button>
          </div>
        ) : recoveryReady ? (
          <div className="mt-5 space-y-4">
            <PasswordField
              label={t("Bagong password", "New password")}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordField
              label={t("Kumpirmahin ang password", "Confirm password")}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {error && (
              <p role="alert" className="text-caption text-danger">
                {error}
              </p>
            )}
            <Button
              block
              disabled={
                busy ||
                password.length < 8 ||
                password !== confirmPassword ||
                !online
              }
              onClick={() => void savePassword()}
            >
              {busy
                ? t("Sine-save…", "Saving…")
                : t("I-save ang bagong password", "Save new password")}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => (
                setEmail(event.target.value), setError(null), setMessage(null)
              )}
            />
            {turnstileSiteKey && (
              <Turnstile
                ref={captchaRef}
                siteKey={turnstileSiteKey}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken(undefined)}
                onError={() => setCaptchaToken(undefined)}
              />
            )}
            {error && (
              <p role="alert" className="text-caption text-danger">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-caption text-fg-2">
                {message}
              </p>
            )}
            <Button
              block
              disabled={
                busy ||
                !online ||
                !email.trim() ||
                (!!turnstileSiteKey && !captchaToken)
              }
              onClick={() => void requestReset()}
            >
              {busy
                ? t("Ipinapadala…", "Sending…")
                : t("Magpadala ng reset link", "Send reset link")}
            </Button>
          </div>
        )}
        {!online && (
          <p role="alert" className="mt-4 text-caption text-danger">
            {t(
              "Walang internet. Subukan ulit kapag may signal.",
              "No internet connection. Try again when you are online.",
            )}
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            navigate(business ? "/biz/auth?mode=login" : "/auth?mode=login")
          }
          className="mt-4 min-h-11 w-full font-display text-sm font-medium text-link"
        >
          {t("Bumalik sa pag-sign in", "Back to sign in")}
        </button>
      </section>
    </main>
  )
}
