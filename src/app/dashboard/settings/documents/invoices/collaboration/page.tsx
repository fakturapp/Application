'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { Users, Crown } from '@/components/ui/icons'

export default function CollaborationSettingsPage() {
  const router = useRouter()
  const { settings, updateSettings, loading } = useInvoiceSettings()
  const { toast } = useToast()
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ team: { plan?: string } }>('/team').then(({ data }) => {
      setPlan(data?.team?.plan ?? 'free')
    })
  }, [])

  const enabled = settings.collaborationEnabled
  const hasTeamPlan = plan === 'team'
  const planLoading = plan === null

  const handleToggle = () => {
    if (!hasTeamPlan) return
    if (enabled) {
      updateSettings({ collaborationEnabled: false })
      toast('Collaboration désactivée', 'info')
    } else {
      updateSettings({ collaborationEnabled: true })
      toast('Collaboration activée', 'success')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Collaboration</h1>
        <p className="text-sm text-muted-foreground">
          Éditez vos documents à plusieurs, en temps réel
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Users className="h-4.5 w-4.5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Collaboration en temps réel
              </h2>
              <p className="text-xs text-muted-foreground">
                Plusieurs personnes sur la même facture, chacune avec son curseur, comme sur Canva
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10' : 'bg-muted'}`}
              >
                <Users
                  className={`h-5 w-5 ${enabled ? 'text-purple-400' : 'text-muted-foreground'}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Activer la collaboration</p>
                <p className="text-xs text-muted-foreground">
                  {enabled
                    ? 'Le partage et l’édition en temps réel sont actifs sur vos documents.'
                    : 'Active le partage et l’édition en temps réel sur vos documents.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={planLoading || !hasTeamPlan}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled ? 'bg-purple-500' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!planLoading && !hasTeamPlan && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2.5">
                <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  La collaboration en temps réel est réservée au forfait Faktur Team.
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => router.push('/dashboard/settings/plan/upgrade')}
              >
                Passer à Team
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
