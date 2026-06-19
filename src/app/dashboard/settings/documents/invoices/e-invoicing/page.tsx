'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { SettingsPage, SettingsHero, SettingsSection, SettingsRow } from '@/components/settings/settings-shell'
import { EInvoicingFlowPreview } from '@/components/settings/e-invoicing-flow-preview'
import {
  FileCheck,
  Info,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  FlaskConical,
} from '@/components/ui/icons'

const OPERATION_CATEGORIES = [
  { id: 'service', name: 'Prestation', desc: 'Services' },
  { id: 'goods', name: 'Livraison', desc: 'Biens' },
  { id: 'mixed', name: 'Mixte', desc: 'Les deux' },
] as const

export default function EInvoicingPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const { toast } = useToast()

  const [showPdpKey, setShowPdpKey] = useState(false)
  const [showEInvoicingModal, setShowEInvoicingModal] = useState(false)
  const [showBetaWarningModal, setShowBetaWarningModal] = useState(false)

  const hasKey = !!settings.pdpApiKey && settings.pdpApiKey !== '••••••••'
  const mode = hasKey ? 'production' : 'sandbox'

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
        <div className="mt-6 space-y-7">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <>
      <SettingsPage>
        <SettingsHero
          icon={<FileCheck className="h-6 w-6" />}
          title="E-Facturation"
          badges={
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <FlaskConical className="h-3 w-3" /> Bêta
            </span>
          }
          tagline="Réforme 2026 — Factur-X, PDP et e-reporting."
          description="Faktur prépare les formats structurés et l’envoi via le prestataire configuré."
        />

        <div className="mt-6">
          <SettingsSection index={1}>
            <EInvoicingFlowPreview enabled={settings.eInvoicingEnabled} mode={mode} />
          </SettingsSection>

          <SettingsSection index={2}>
            <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft/40 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-foreground">
                À partir de septembre 2026, les factures B2B devront passer par une plateforme agréée.
              </p>
            </div>
            <div className="mt-4">
              <SettingsRow
                title="Activer la facturation électronique"
                desc="Prépare les champs et exports structurés pour vos factures."
                control={
                  <Switch
                    checked={settings.eInvoicingEnabled}
                    onChange={(next) => {
                      if (next) setShowEInvoicingModal(true)
                      else updateSettings({ eInvoicingEnabled: false })
                    }}
                  />
                }
              />
            </div>
          </SettingsSection>

          {settings.eInvoicingEnabled && (
            <>
              <SettingsSection
                index={3}
                title="Prestataire (PDP)"
                desc="Laissez vide pour rester en mode sandbox local."
              >
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Clé API B2Brouter (optionnel)
                    </label>
                    <div className="relative">
                      <Input
                        type={showPdpKey ? 'text' : 'password'}
                        placeholder="Laissez vide pour le mode sandbox…"
                        value={settings.pdpApiKey === '••••••••' ? '' : settings.pdpApiKey || ''}
                        onChange={(e) =>
                          updateSettings({
                            pdpApiKey: e.target.value,
                            pdpProvider: e.target.value ? 'b2brouter' : 'sandbox',
                          })
                        }
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPdpKey(!showPdpKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPdpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {hasKey
                        ? 'Connecté à B2Brouter — envoi via le prestataire configuré.'
                        : 'Mode sandbox actif — les factures sont générées localement sans envoi externe.'}
                    </p>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection
                index={4}
                title="Catégorie d’opération par défaut"
                desc="Appliquée aux nouvelles factures électroniques."
              >
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {OPERATION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateSettings({ defaultOperationCategory: cat.id })}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        settings.defaultOperationCategory === cat.id
                          ? 'border-accent bg-accent-soft/50'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <p className="text-xs font-medium text-foreground">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <SettingsRow
                    title="TVA sur les débits par défaut"
                    desc="Ajoute la mention dans les factures et le XML Factur-X."
                    control={
                      <Switch
                        checked={settings.defaultVatOnDebits}
                        onChange={(next) => updateSettings({ defaultVatOnDebits: next })}
                      />
                    }
                  />
                </div>
              </SettingsSection>

              <SettingsSection index={5} title="Fonctionnalités incluses">
                <div className="mt-3 space-y-2">
                  {[
                    'Génération XML Factur-X/CII de travail',
                    'Mentions obligatoires réforme 2026',
                    'SIREN client et catégorie d’opération',
                    'Envoi via B2Brouter selon la configuration du compte',
                    'Validation structurelle de premier niveau',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </SettingsSection>
            </>
          )}
        </div>
      </SettingsPage>

      <Dialog open={showEInvoicingModal} onClose={() => setShowEInvoicingModal(false)}>
        <div className="max-w-md p-6">
          <DialogHeader onClose={() => setShowEInvoicingModal(false)} icon={<FileCheck className="h-5 w-5 text-accent" />}>
            <DialogTitle>Activer la facturation électronique</DialogTitle>
            <DialogDescription>Réforme obligatoire à partir de septembre 2026</DialogDescription>
          </DialogHeader>
          <div className="mb-6 space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              En activant cette option, Faktur prépare les champs et exports de travail utiles pour la réforme française.
            </p>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {[
                'Un XML Factur-X/CII pourra être produit pour validation',
                'Base de travail pour les formats attendus par la réforme',
                'Aucun impact sur vos documents existants',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="text-xs text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEInvoicingModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                updateSettings({ eInvoicingEnabled: true })
                setShowEInvoicingModal(false)
                setShowBetaWarningModal(true)
              }}
            >
              <FileCheck className="mr-2 h-4 w-4" /> Activer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={showBetaWarningModal} onClose={() => setShowBetaWarningModal(false)}>
        <div className="max-w-md p-6">
          <DialogHeader onClose={() => setShowBetaWarningModal(false)} icon={<FlaskConical className="h-5 w-5 text-amber-500" />}>
            <DialogTitle className="flex items-center gap-2">
              Fonctionnalité en bêta
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                Bêta
              </span>
            </DialogTitle>
            <DialogDescription>Aperçu anticipé de la facturation électronique</DialogDescription>
          </DialogHeader>
          <div className="mb-6 space-y-3">
            <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm leading-relaxed text-foreground">
                  Cette fonctionnalité est actuellement en <strong>version bêta</strong>. Elle peut présenter des
                  dysfonctionnements ou ne pas fonctionner correctement dans certains cas.
                </p>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {[
                'Les formats générés peuvent évoluer',
                'Les intégrations et tests officiels restent à valider',
                'Vos données existantes ne seront pas affectées',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowBetaWarningModal(false); toast('Facturation électronique activée', 'success') }}>
              J’ai compris
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  )
}
