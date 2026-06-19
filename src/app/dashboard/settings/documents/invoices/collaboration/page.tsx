'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { Users, Crown, MousePointer2, Eye } from '@/components/ui/icons'
import { LiveCollaborationPreview } from '@/components/settings/live-collaboration-preview'
import { SettingsPage, SettingsHero, SettingsSection, SettingsRow } from '@/components/settings/settings-shell'

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

  const handleToggle = (next: boolean) => {
    if (!hasTeamPlan) return
    updateSettings({ collaborationEnabled: next })
    toast(next ? 'Collaboration activée' : 'Collaboration désactivée', next ? 'success' : 'info')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="mt-6 border-t border-border py-7">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage>
      <SettingsHero
        icon={<Users className="h-6 w-6" />}
        title="Collaboration"
        badges={
          enabled && hasTeamPlan ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <Crown className="h-3 w-3" /> Team
            </span>
          )
        }
        tagline="Éditez vos documents à plusieurs, en temps réel."
        description="Chaque membre dispose de son propre curseur nommé, comme sur Canva ou Figma."
      />

      <div className="mt-6">
        <SettingsSection index={1}>
          <LiveCollaborationPreview active={enabled && hasTeamPlan} />
        </SettingsSection>

        <SettingsSection
          index={2}
          title="Édition en temps réel"
          desc={
            enabled
              ? 'Le partage et l’édition collaborative sont actifs sur vos documents.'
              : 'Activez le partage et l’édition collaborative sur vos documents.'
          }
          action={
            <Switch
              checked={enabled}
              onChange={handleToggle}
              disabled={planLoading || !hasTeamPlan}
              className="mt-1"
            />
          }
        />

        <SettingsSection index={3} title="Ce que vous obtenez">
          <div className="mt-2 divide-y divide-border">
            <SettingsRow
              icon={<MousePointer2 className="h-4 w-4" />}
              title="Curseurs nommés"
              desc="Voyez en direct où travaille chaque membre de l’équipe."
            />
            <SettingsRow
              icon={<Eye className="h-4 w-4" />}
              title="Modifications instantanées"
              desc="Chaque champ se met à jour pour tout le monde, sans rechargement."
            />
            <SettingsRow
              icon={<Users className="h-4 w-4" />}
              title="Invités externes"
              desc="Partagez un document avec un client ou un comptable, en lecture ou édition."
            />
          </div>
        </SettingsSection>

        {!planLoading && !hasTeamPlan && (
          <SettingsSection index={4}>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-accent-soft/40 p-5">
              <div className="flex items-start gap-3">
                <Crown className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Réservé au forfait Team</p>
                  <p className="text-xs text-muted-foreground">
                    Passez à Faktur Team pour éditer vos documents à plusieurs.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => router.push('/dashboard/settings/plan/upgrade')}
              >
                Passer à Team
              </Button>
            </div>
          </SettingsSection>
        )}
      </div>
    </SettingsPage>
  )
}
