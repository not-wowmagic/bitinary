export function authRedirectUrl(path: string, query: Record<string, string> = {}): string {
  const configuredBasePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
  const basePath = configuredBasePath.endsWith('/') ? configuredBasePath : `${configuredBasePath}/`
  const baseUrl = new URL(basePath, window.location.origin)
  const redirectUrl = new URL(path.replace(/^\/+/, ''), baseUrl)

  for (const [key, value] of Object.entries(query)) {
    redirectUrl.searchParams.set(key, value)
  }

  return redirectUrl.toString()
}
