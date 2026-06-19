'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { getTemplate } from '@/lib/invoice-templates'
import { TemplateThumbnail } from '@/components/shared/template-thumbnail'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import { TemplateModal } from '@/components/settings/template-modal'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { FormSelect } from '@/components/ui/dropdown'
import { useAuth } from '@/lib/auth'
import { ProGate } from '@/components/billing/pro-gate'
import { SettingsPage, SettingsHero, SettingsSection, SettingsRow } from '@/components/settings/settings-shell'
import {
  ImagePlus,
  ImageIcon,
  Palette,
  Check,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  Type,
  LayoutTemplate,
  Building2,
} from '@/components/ui/icons'

const accentColors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Vert', value: '#22c55e' },
  { name: 'Turquoise', value: '#14b8a6' },
  { name: 'Gris', value: '#6b7280' },
  { name: 'Noir', value: '#18181b' },
]

export default function InvoiceAppearancePage() {
  const { toast } = useToast()
  const { settings, companyLogoUrl, loading, updateSettings, updateAndSave, uploadLogo, uploadCustomBackground, removeCustomBackground, refreshCompanyLogo } = useInvoiceSettings()
  const { user } = useAuth()
  const locked = !(user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team')
  const [uploading, setUploading] = useState(false)
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [removingBackground, setRemovingBackground] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  const currentTemplate = getTemplate(settings.template, settings.darkMode)
  const effectiveLogoUrl = settings.logoSource === 'company' ? companyLogoUrl : settings.logoUrl

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadLogo(file)
      toast('Logo mis à jour', 'success')
    } catch {
      toast("Erreur lors de l'envoi du logo", 'error')
    }
    setUploading(false)
  }

  function handleRemoveLogo() {
    updateSettings({ logoUrl: null })
  }

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast('Image trop lourde, 8 Mo maximum', 'error')
      e.target.value = ''
      return
    }
    setUploadingBackground(true)
    try {
      await uploadCustomBackground(file)
      toast('Fond personnalisé enregistré', 'success')
    } catch {
      toast("Erreur lors de l'envoi du fond", 'error')
    }
    setUploadingBackground(false)
    e.target.value = ''
  }

  async function handleRemoveBackground() {
    setRemovingBackground(true)
    try {
      await removeCustomBackground()
      toast('Fond personnalisé supprimé', 'success')
    } catch {
      toast('Erreur lors de la suppression du fond', 'error')
    }
    setRemovingBackground(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="mt-6 space-y-7">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage>
      <SettingsHero
        icon={<Palette className="h-6 w-6" />}
        title="Apparence"
        tagline="L’identité visuelle de vos factures et devis."
        description="Modèle, logo, couleur et police — l’aperçu se met à jour en direct."
      />

      <div className="mt-6">
        <SettingsSection index={1}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Aperçu en direct
          </p>
          <InvoicePreview />
        </SettingsSection>

        <ProGate locked={locked}>
          <SettingsSection index={2} title="Modèle de document" desc="L’apparence générale de vos factures et devis.">
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="group mt-3 flex w-full items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-accent/40 hover:bg-accent-soft/30"
            >
              <div className="w-16 shrink-0">
                <TemplateThumbnail tpl={currentTemplate} accentColor={settings.accentColor} selected={false} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{currentTemplate.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{currentTemplate.description}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Changer de modèle <ChevronRight className="h-3 w-3" />
                </p>
              </div>
              <LayoutTemplate className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
            </button>
            <div className="mt-1">
              <SettingsRow
                icon={settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                title="Mode sombre"
                desc="Appliquer le thème sombre au document."
                control={<Switch checked={settings.darkMode} onChange={(v) => updateSettings({ darkMode: v })} />}
              />
            </div>
          </SettingsSection>
        </ProGate>

        <SettingsSection index={3} title="Logo" desc="Apparaît en en-tête de vos factures et devis.">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => updateSettings({ logoSource: 'custom' })}
              className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                settings.logoSource === 'custom' ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${settings.logoSource === 'custom' ? 'bg-accent-soft' : 'bg-muted'}`}>
                <ImagePlus className={`h-4 w-4 ${settings.logoSource === 'custom' ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Logo personnalisé</p>
                <p className="text-[10px] text-muted-foreground">Importer votre propre logo</p>
              </div>
            </button>
            <button
              onClick={() => { updateSettings({ logoSource: 'company' }); refreshCompanyLogo() }}
              className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                settings.logoSource === 'company' ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${settings.logoSource === 'company' ? 'bg-accent-soft' : 'bg-muted'}`}>
                <Building2 className={`h-4 w-4 ${settings.logoSource === 'company' ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Logo entreprise</p>
                <p className="text-[10px] text-muted-foreground">Utiliser celui de l’entreprise</p>
              </div>
            </button>
          </div>

          {settings.logoSource === 'custom' ? (
            <div className="mt-4 flex items-start gap-6">
              <div className="group relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-dashed border-border bg-surface" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground/60" />
                  )}
                </div>
                {settings.logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">Format recommandé : PNG ou SVG, fond transparent, 500x500px minimum.</p>
                <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <><Spinner /> Envoi…</> : 'Télécharger un logo'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-border p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-surface" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt="Logo entreprise" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground/60" />
                )}
              </div>
              <div className="flex-1">
                {companyLogoUrl ? (
                  <p className="text-sm text-muted-foreground">Le logo de votre entreprise sera utilisé sur vos documents.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun logo d’entreprise configuré. Ajoutez-en un dans la page{' '}
                    <a href="/dashboard/settings/company" className="text-accent underline underline-offset-2">Entreprise</a>.
                  </p>
                )}
              </div>
            </div>
          )}

          {effectiveLogoUrl && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Arrondi du logo</label>
                <span className="text-xs tabular-nums text-muted-foreground">{settings.logoBorderRadius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={settings.logoBorderRadius}
                onChange={(e) => updateSettings({ logoBorderRadius: Number(e.target.value) })}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent"
              />
            </div>
          )}
        </SettingsSection>

        <ProGate locked={locked}>
          <SettingsSection index={4} title="Fond du document" desc="Une image de fond appliquée à vos factures et devis.">
            <div className="mt-3 flex items-start gap-6">
              <div className="relative w-20 shrink-0">
                <TemplateThumbnail tpl={currentTemplate} accentColor={settings.accentColor} selected={false} size="sm" />
                {settings.customBackgroundUrl && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-lg"
                    style={{ backgroundImage: `url('${settings.customBackgroundUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Format recommandé : JPG, PNG ou WebP, ratio A4 (210x297), 8 Mo maximum. Le fond prime sur la couleur du modèle.
                </p>
                <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBackgroundUpload} />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => backgroundInputRef.current?.click()} disabled={uploadingBackground}>
                    {uploadingBackground ? <><Spinner /> Envoi…</> : settings.customBackgroundUrl ? 'Remplacer le fond' : 'Télécharger un fond'}
                  </Button>
                  {settings.customBackgroundUrl && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveBackground} disabled={removingBackground} className="text-destructive hover:text-destructive">
                      {removingBackground ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">Supprimer</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SettingsSection>
        </ProGate>

        <ProGate locked={locked}>
          <SettingsSection index={5} title="Couleur des documents" desc="Couleur d’accent utilisée dans vos factures et devis.">
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap gap-2.5">
                {accentColors.map((color) => (
                  <button key={color.value} onClick={() => updateSettings({ accentColor: color.value })} className="group relative" title={color.name}>
                    <div
                      className={`h-9 w-9 rounded-lg transition-all ${
                        settings.accentColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-background' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value, ...(settings.accentColor === color.value ? ({ '--tw-ring-color': color.value } as React.CSSProperties) : {}) }}
                    />
                    {settings.accentColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: settings.accentColor }} />
                <Input value={settings.accentColor} onChange={(e) => updateSettings({ accentColor: e.target.value })} placeholder="#6366f1" className="max-w-[140px] font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Code hexadécimal</p>
              </div>
            </div>
          </SettingsSection>
        </ProGate>

        <ProGate locked={locked}>
          <SettingsSection index={6} title="Police des documents" desc="Police utilisée sur les factures, devis et PDF.">
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-5" style={{ fontFamily: `'${settings.documentFont}', sans-serif` }}>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Aperçu</p>
                <p className="text-[34px] font-bold leading-tight tracking-tight text-foreground">Aa Bb Cc</p>
                <p className="mt-0.5 text-[20px] leading-tight text-foreground/80">abcdefghijklmnopqrstuvwxyz</p>
                <p className="text-[20px] leading-tight text-foreground/80">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="text-[20px] leading-tight tabular-nums text-foreground/80">0123456789 — €$£¥&amp;@#%</p>
              </div>
              <FormSelect
                value={settings.documentFont}
                onChange={(v) => updateSettings({ documentFont: v })}
                options={[
                  { value: 'Lexend', label: 'Lexend (par défaut)' },
                  { value: 'Inter', label: 'Inter (géométrique)' },
                  { value: 'Poppins', label: 'Poppins (moderne)' },
                  { value: 'Roboto', label: 'Roboto (classique)' },
                  { value: 'Open Sans', label: 'Open Sans (lisible)' },
                  { value: 'Lato', label: 'Lato (élégante)' },
                  { value: 'Montserrat', label: 'Montserrat (professionnel)' },
                  { value: 'Nunito', label: 'Nunito (arrondie)' },
                ]}
              />
            </div>
          </SettingsSection>
        </ProGate>
      </div>

      <TemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        accentColor={settings.accentColor}
        currentTemplate={settings.template}
        onSelect={async (id) => {
          const applied = await updateAndSave({ template: id })
          if (applied && applied.template !== id) {
            toast('La personnalisation des documents est réservée aux forfaits Pro et Team', 'error')
          }
        }}
      />
    </SettingsPage>
  )
}
