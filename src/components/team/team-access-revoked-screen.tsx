'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Lock, ArrowRightLeft, LogOut } from '@/components/ui/icons'

interface TeamListItem {
  id: string
  name: string
  isCurrent: boolean
}

export function TeamAccessRevokedScreen({ teamName }: { teamName: string | null }) {
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get<{ teams: TeamListItem[] }>('/team/all').then(({ data }) => {
      if (data?.teams) setTeams(data.teams)
    })
  }, [])

  const others = teams.filter((t) => !t.isCurrent)

  async function switchTo(teamId: string) {
    setBusy(true)
    const { error } = await api.post('/team/switch', { teamId })
    if (!error) {
      window.location.href = '/dashboard'
      return
    }
    setBusy(false)
  }

  async function leave() {
    setBusy(true)
    const { error } = await api.post('/team/leave', {})
    if (!error) {
      window.location.href = '/dashboard'
      return
    }
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Accès suspendu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le propriétaire de l&apos;équipe {teamName ? `« ${teamName} »` : ''} n&apos;a plus le plan
          requis pour vous garder dans l&apos;équipe. Vos accès ont été désactivés.
        </p>

        <div className="mt-6 space-y-2">
          {others.map((t) => (
            <Button key={t.id} className="w-full" onClick={() => switchTo(t.id)} disabled={busy}>
              <ArrowRightLeft className="h-4 w-4" /> Aller sur « {t.name} »
            </Button>
          ))}
          <Button variant="outline" className="w-full" onClick={leave} disabled={busy}>
            {busy ? <Spinner /> : <LogOut className="h-4 w-4" />} Quitter l&apos;équipe
          </Button>
        </div>
      </div>
    </div>
  )
}
