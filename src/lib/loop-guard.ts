const SSO_PARAM = '_sso'

export const MAX_SSO_TRIES = 3

export function readSsoTries(): number {
  if (typeof window === 'undefined') return 0
  const raw = new URLSearchParams(window.location.search).get(SSO_PARAM)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function returnUrlWithTries(tries: number): string {
  const url = new URL(window.location.href)
  url.searchParams.set(SSO_PARAM, String(tries))
  return url.toString()
}

export function clearSsoParam(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has(SSO_PARAM)) return
  url.searchParams.delete(SSO_PARAM)
  const clean = url.pathname + url.search + url.hash
  window.history.replaceState({}, '', clean)
}
