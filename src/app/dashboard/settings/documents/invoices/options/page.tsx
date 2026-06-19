'use client'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import { SettingsPage, SettingsHero, SettingsSection, SettingsSplit, SettingsRow } from '@/components/settings/settings-shell'
import { Zap, ClipboardList, SlidersHorizontal, Check } from '@/components/ui/icons'

const VAT_RATE_PRESETS = [0, 2.1, 5.5, 10, 20]

const DOC_OPTIONS = [
  { key: 'defaultSignatureField' as const, label: 'Champ de signature', desc: 'Afficher les zones de signature émetteur et client' },
  { key: 'defaultShowNotes' as const, label: 'Notes et conditions', desc: 'Afficher la zone de notes et conditions' },
  { key: 'defaultShowDeliveryAddress' as const, label: 'Adresse de livraison', desc: 'Afficher un champ adresse de livraison' },
]

const COLUMN_OPTIONS = [
  { key: 'defaultShowQuantityColumn' as const, label: 'Quantité', desc: 'Afficher la colonne quantité' },
  { key: 'defaultShowUnitColumn' as const, label: 'Unité', desc: 'Afficher la colonne unité' },
  { key: 'defaultShowUnitPriceColumn' as const, label: 'Prix unitaire HT', desc: 'Afficher la colonne de prix unitaire HT' },
  { key: 'defaultShowVatColumn' as const, label: 'Taux de TVA', desc: 'Afficher la colonne du pourcentage de TVA' },
]

export default function InvoiceOptionsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const isDetailedBilling = settings.billingType === 'detailed'

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="space-y-7">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
          <Skeleton className="hidden h-[560px] w-full rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage wide>
      <SettingsHero
        icon={<SlidersHorizontal className="h-6 w-6" />}
        title="Options"
        tagline="Type de facturation et sections du document."
        description="Ces réglages servent de base aux nouveaux documents."
      />

      <SettingsSplit>
        <div className="min-w-0">
        <SettingsSection index={1} title="Modèle de facturation" desc="Le type de facture par défaut.">
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSettings({ billingType: 'quick' })}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                settings.billingType === 'quick' ? 'border-accent bg-accent-soft/50 shadow-sm' : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              {settings.billingType === 'quick' && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <Zap className="mb-2 h-5 w-5 text-accent" />
              <p className="text-sm font-medium text-foreground">Rapide</p>
              <p className="mt-1 text-xs text-muted-foreground">Facturation simplifiée avec les informations essentielles</p>
            </button>
            <button
              onClick={() => updateSettings({ billingType: 'detailed' })}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                settings.billingType === 'detailed' ? 'border-accent bg-accent-soft/50 shadow-sm' : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              {settings.billingType === 'detailed' && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <ClipboardList className="mb-2 h-5 w-5 text-accent" />
              <p className="text-sm font-medium text-foreground">Complet</p>
              <p className="mt-1 text-xs text-muted-foreground">Factures détaillées avec TVA, remises, conditions et mentions</p>
            </button>
          </div>
        </SettingsSection>

        <SettingsSection index={2} title="Sections du document" desc="Sections affichées par défaut sur vos documents.">
          <div className="mt-1 divide-y divide-border">
            {DOC_OPTIONS.map((opt) => (
              <SettingsRow
                key={opt.key}
                title={opt.label}
                desc={opt.desc}
                control={<Switch checked={!!settings[opt.key]} onChange={(v) => updateSettings({ [opt.key]: v })} />}
              />
            ))}
          </div>

          {isDetailedBilling && (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold text-foreground">Colonnes du mode complet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Base pour les nouveaux documents en mode complet.
              </p>
              <div className="mt-3 divide-y divide-border/60">
                {COLUMN_OPTIONS.map((opt) => (
                  <SettingsRow
                    key={opt.key}
                    title={opt.label}
                    desc={opt.desc}
                    control={<Switch checked={!!settings[opt.key]} onChange={(v) => updateSettings({ [opt.key]: v })} />}
                  />
                ))}
              </div>

              {settings.defaultShowVatColumn && (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Taux de TVA par défaut
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {VAT_RATE_PRESETS.map((rate) => {
                      const isActive = Math.abs((settings.defaultVatRate ?? 20) - rate) < 0.001
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => updateSettings({ defaultVatRate: rate })}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActive ? 'border-accent bg-accent-soft/60 text-accent' : 'border-border hover:border-muted-foreground/40'
                          }`}
                        >
                          {rate}%
                        </button>
                      )
                    })}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={String(settings.defaultVatRate ?? 20)}
                    onChange={(e) => {
                      const next = Number(e.target.value)
                      updateSettings({ defaultVatRate: Number.isFinite(next) ? next : 0 })
                    }}
                    className="text-sm"
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Appliqué aux nouvelles lignes vides. Les produits du catalogue gardent leur propre TVA.
                  </p>
                </div>
              )}
            </div>
          )}
        </SettingsSection>

        <SettingsSection index={3} title="Langue par défaut" desc="Langue utilisée à la création d’un document.">
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { id: 'fr', label: 'Français' },
              { id: 'en', label: 'English' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => updateSettings({ defaultLanguage: lang.id })}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  settings.defaultLanguage === lang.id ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{lang.label}</p>
              </button>
            ))}
          </div>
        </SettingsSection>
        </div>

        <div className="mt-7 lg:mt-0">
          <InvoicePreview />
        </div>
      </SettingsSplit>
    </SettingsPage>
  )
}
