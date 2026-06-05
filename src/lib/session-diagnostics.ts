import { getVaultCookie } from '@/lib/cross-domain-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/v1'

export interface SessionDiagnostics {
  reason: string
  detail: string
  signals: Record<string, unknown>
}

export async function diagnoseSessionLoop(tries: number): Promise<SessionDiagnostics> {
  const hasLocalToken =
    typeof window !== 'undefined' && !!localStorage.getItem('faktur_token')
  const hasVaultCookie = !!getVaultCookie()

  let meStatus: number | null = null
  let meReachable = false
  try {
    const res = await fetch(`${API_URL}${API_PREFIX}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    meStatus = res.status
    meReachable = true
  } catch {
    meReachable = false
  }

  const signals: Record<string, unknown> = {
    tries,
    hasLocalToken,
    hasVaultCookie,
    meReachable,
    meStatus,
    accountUrl: process.env.NEXT_PUBLIC_ACCOUNT_URL || null,
    apiUrl: API_URL,
    origin: typeof window !== 'undefined' ? window.location.origin : null,
  }

  let reason = 'Session impossible à établir'
  let detail =
    'La connexion a réussi côté compte, mais ce domaine ne reçoit pas votre session. ' +
    'Vous avez été déconnecté pour éviter une boucle de redirection.'

  if (!meReachable) {
    reason = "Serveur d'authentification injoignable"
    detail =
      "Impossible de contacter le serveur d'authentification (réseau ou CORS). " +
      'Vous avez été déconnecté pour éviter une boucle de redirection.'
  } else if (meStatus === 401) {
    reason = 'Session non reconnue sur ce domaine'
    detail =
      "Le serveur ne reconnaît pas votre session ici : le cookie de session n'est pas transmis " +
      'entre les sous-domaines (COOKIE_DOMAIN / CORS). ' +
      'Vous avez été déconnecté pour éviter une boucle de redirection.'
  }

  console.error('[auth] redirect loop detected', { reason, ...signals })
  return { reason, detail, signals }
}
