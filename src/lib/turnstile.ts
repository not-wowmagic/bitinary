// Set VITE_TURNSTILE_SITE_KEY=disabled in .env.local to skip captcha for local testing.
const configured = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "")
export const turnstileSiteKey =
  configured === "disabled" ? "" : configured || "0x4AAAAAAGA3v2BFmMhJ5ANG"
