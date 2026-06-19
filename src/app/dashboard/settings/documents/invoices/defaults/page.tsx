'use client'

import { ClipboardList, Check, Crown } from '@/components/ui/icons'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SettingsPage, SettingsHero, SettingsSection, SettingsSplit } from '@/components/settings/settings-shell'

const FOOTER_MODES = [
  { id: 'company_info' as const, label: 'Informations entreprise', desc: 'Raison sociale, SIREN, TVA, adresse' },
  { id: 'custom' as const, label: 'Texte personnalisé', desc: 'Saisissez votre propre texte de pied de page' },
]

export default function InvoiceDefaultsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const { user } = useAuth()
  const router = useRouter()
  const isPro = user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team'

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="space-y-7">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <Skeleton className="hidden h-[560px] w-full rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage wide>
      <SettingsHero
        icon={<ClipboardList className="h-6 w-6" />}
        title="Valeurs par défaut"
        tagline="Pré-remplissage automatique de vos documents."
        description="Ces valeurs sont insérées à la création d’un devis ou d’une facture."
      />

      <SettingsSplit>
        <div className="min-w-0">
          <SettingsSection index={1} title="Pré-remplissage" desc="Appliqué à la création d’un devis ou d’une facture.">
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Objet par défaut</label>
                <Input
                  placeholder="Ex : Développement site web"
                  value={settings.defaultSubject || ''}
                  onChange={(e) => updateSettings({ defaultSubject: e.target.value || null })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Conditions d’acceptation</label>
                <textarea
                  placeholder="Conditions d'acceptation par défaut…"
                  value={settings.defaultAcceptanceConditions || ''}
                  onChange={(e) => updateSettings({ defaultAcceptanceConditions: e.target.value || null })}
                  className="min-h-[60px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Champ libre</label>
                <textarea
                  placeholder="Texte supplémentaire par défaut…"
                  value={settings.defaultFreeField || ''}
                  onChange={(e) => updateSettings({ defaultFreeField: e.target.value || null })}
                  className="min-h-[60px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  rows={2}
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection index={2} title="Pied de page" desc="Ce qui apparaît en bas de vos documents.">
            {isPro ? (
              <>
                <div className="mt-3 space-y-2">
                  {FOOTER_MODES.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSettings({ footerMode: opt.id })}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        settings.footerMode === opt.id ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${settings.footerMode === opt.id ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`}>
                        {settings.footerMode === opt.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                {settings.footerMode === 'custom' && (
                  <div className="mt-3">
                    <Input
                      placeholder="Ex : Conditions générales de vente…"
                      value={settings.defaultFooterText || ''}
                      onChange={(e) => updateSettings({ defaultFooterText: e.target.value?.slice(0, 50) || null })}
                      className="text-sm"
                      maxLength={50}
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">50 caractères max.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-accent-soft/40 p-4">
                <div className="flex items-start gap-3">
                  <Crown className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pied de page personnalisé</p>
                    <p className="text-xs text-muted-foreground">
                      En forfait Gratuit, vos documents affichent « Créé avec Faktur ». Passez à Pro pour le remplacer
                      par vos informations ou votre propre texte.
                    </p>
                  </div>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
                  Passer à Pro
                </Button>
              </div>
            )}
          </SettingsSection>
        </div>

        <div className="mt-7 lg:mt-0">
          <InvoicePreview />
        </div>
      </SettingsSplit>
    </SettingsPage>
  )
}
