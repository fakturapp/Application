'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { AlertTriangle } from '@/components/ui/icons'

export function CollaborationGraceBanner() {
  const { user } = useAuth()
  const router = useRouter()

  const team = user?.teams?.find((t) => t.id === user.currentTeamId)
  if (!team?.collaborationGraceEndsAt) return null

  const ms = new Date(team.collaborationGraceEndsAt).getTime() - Date.now()
  if (ms <= 0) return null
  const daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))

  const label = `Équipe « ${team.name} » : le plan Team est terminé. Retirez vos membres sous ${daysLeft} jour${daysLeft > 1 ? 's' : ''}, sinon ils seront désactivés. Cliquez pour gérer.`

  return (
    <button
      type="button"
      onClick={() => router.push('/dashboard/settings/members')}
      aria-label={label}
      className="flex w-full items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors hover:bg-amber-400"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
    </button>
  )
}
