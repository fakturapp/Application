export const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.fakturapp.cc'

const VAULT_COOKIE_NAME = 'faktur_vault_key'
const VAULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 15

export function setVaultCookie(value: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${VAULT_COOKIE_NAME}=${encodeURIComponent(value)}; domain=${COOKIE_DOMAIN}; path=/; max-age=${VAULT_COOKIE_MAX_AGE}; secure; samesite=lax`
}

export function getVaultCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const cookie of cookies) {
    const eq = cookie.indexOf('=')
    if (eq === -1) continue
    const name = cookie.slice(0, eq)
    if (name === VAULT_COOKIE_NAME) {
      return decodeURIComponent(cookie.slice(eq + 1))
    }
  }
  return null
}

export function clearVaultCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${VAULT_COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; path=/; max-age=0; secure; samesite=lax`
}
