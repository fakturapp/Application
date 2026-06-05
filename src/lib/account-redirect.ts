export const ACCOUNT_URL = process.env.NEXT_PUBLIC_ACCOUNT_URL || ''

export function accountLoginUrl(returnTo?: string): string {
  if (!ACCOUNT_URL) {
    return '/login'
  }
  const target =
    returnTo ??
    (typeof window !== 'undefined' ? window.location.href : '')
  const base = `${ACCOUNT_URL.replace(/\/+$/, '')}/login`
  if (!target) return base
  return `${base}?redirect=${encodeURIComponent(target)}`
}

export function accountRegisterUrl(returnTo?: string): string {
  if (!ACCOUNT_URL) {
    return '/register'
  }
  const target =
    returnTo ??
    (typeof window !== 'undefined' ? window.location.href : '')
  const base = `${ACCOUNT_URL.replace(/\/+$/, '')}/register`
  if (!target) return base
  return `${base}?redirect=${encodeURIComponent(target)}`
}

export function accountUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!ACCOUNT_URL) return normalized
  return `${ACCOUNT_URL.replace(/\/+$/, '')}${normalized}`
}

export function redirectToAccountLogin(): void {
  if (typeof window === 'undefined') return
  window.location.href = accountLoginUrl()
}
