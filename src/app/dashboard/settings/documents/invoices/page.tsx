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
import { SettingsPage, SettingsHero, SettingsSection, SettingsSplit, SettingsRow } from '@/components/settings/settings-shell'
import {
  ImagePlus,
  Upload,
  Palette,
  Check,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
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

const FONT_OPTIONS = [
  { value: 'Lexend', label: 'Lexend (par défaut)' },
  { value: 'Inter', label: 'Inter (géométrique)' },
  { value: 'Poppins', label: 'Poppins (moderne)' },
  { value: 'Roboto', label: 'Roboto (classique)' },
  { value: 'Open Sans', label: 'Open Sans (lisible)' },
  { value: 'Lato', label: 'Lato (élégante)' },
  { value: 'Montserrat', label: 'Montserrat (professionnel)' },
  { value: 'Nunito', label: 'Nunito (arrondie)' },
]

export default function InvoiceAppearancePage() {
  const { toast } = useToast()
  const { settings, companyLogoUrl, loading, updateSettings, updateAndSave, uploadLogo, uploadCustomFont, removeCustomFont, refreshCompanyLogo } = useInvoiceSettings()
  const { user } = useAuth()
  const locked = !(user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team')
  const [uploading, setUploading] = useState(false)
  const [uploadingFont, setUploadingFont] = useState(false)
  const [removingFont, setRemovingFont] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  const currentTemplate = getTemplate(settings.template, settings.darkMode)
  const effectiveLogoUrl = settings.logoSource === 'company' ? companyLogoUrl : settings.logoUrl
  const usingCustomFont = !!settings.customFontName && settings.documentFont === settings.customFontName
  const fontValue = usingCustomFont ? 'custom' : settings.documentFont

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

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast('Police trop lourde, 5 Mo maximum', 'error')
      e.target.value = ''
      return
    }
    setUploadingFont(true)
    try {
      await uploadCustomFont(file)
      toast('Police personnalisée enregistrée', 'success')
    } catch {
      toast("Erreur lors de l'envoi de la police", 'error')
    }
    setUploadingFont(false)
    e.target.value = ''
  }

  async function handleRemoveFont() {
    setRemovingFont(true)
    try {
      await removeCustomFont()
      toast('Police personnalisée supprimée', 'success')
    } catch {
      toast('Erreur lors de la suppression de la police', 'error')
    }
    setRemovingFont(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="space-y-7">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <Skeleton className="hidden h-[560px] w-full rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage wide>
      <SettingsHero
        icon={<Palette className="h-6 w-6" />}
        title="Apparence"
        tagline="L’identité visuelle de vos factures et devis."
        description="Modèle, logo, couleur et police — l’aperçu se met à jour en direct."
      />

      <SettingsSplit>
        <div className="min-w-0">
          <ProGate locked={locked}>
            <SettingsSection index={1} title="Modèle de document" desc="L’apparence générale de vos documents.">
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
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
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

          <SettingsSection index={2} title="Logo" desc="Apparaît en en-tête de vos documents.">
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
                  <p className="text-xs font-medium text-foreground">Personnalisé</p>
                  <p className="text-[10px] text-muted-foreground">Votre propre logo</p>
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
                  <p className="text-xs font-medium text-foreground">Entreprise</p>
                  <p className="text-[10px] text-muted-foreground">Celui de l’entreprise</p>
                </div>
              </button>
            </div>

            {settings.logoSource === 'custom' ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="group relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden border-2 border-dashed border-border bg-surface" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                    ) : (
                      <ImagePlus className="h-7 w-7 text-muted-foreground/60" />
                    )}
                  </div>
                  {settings.logoUrl && (
                    <button onClick={handleRemoveLogo} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">PNG ou SVG, fond transparent, 500×500px min.</p>
                  <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <><Spinner /> Envoi…</> : 'Télécharger un logo'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-border p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-surface" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Logo entreprise" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground/60" />
                  )}
                </div>
                <p className="flex-1 text-xs text-muted-foreground">
                  {companyLogoUrl
                    ? 'Le logo de votre entreprise sera utilisé.'
                    : <>Aucun logo configuré. Ajoutez-en un dans <a href="/dashboard/settings/company" className="text-accent underline underline-offset-2">Entreprise</a>.</>}
                </p>
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
            <SettingsSection index={3} title="Couleur d’accent" desc="Utilisée dans vos factures et devis.">
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2.5">
                  {accentColors.map((color) => (
                    <button key={color.value} onClick={() => updateSettings({ accentColor: color.value })} className="group relative" title={color.name}>
                      <div
                        className={`h-9 w-9 rounded-lg transition-all ${settings.accentColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-background' : 'hover:scale-105'}`}
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
                </div>
              </div>
            </SettingsSection>
          </ProGate>

          <ProGate locked={locked}>
            <SettingsSection index={4} title="Police des documents" desc="Sur les factures, devis et PDF.">
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-border bg-muted/30 p-4" style={{ fontFamily: `'${settings.documentFont}', sans-serif` }}>
                  <p className="text-[28px] font-bold leading-tight tracking-tight text-foreground">Aa Bb Cc</p>
                  <p className="text-sm text-foreground/70">abcdefghijklmnopqrstuvwxyz · 0123456789 €</p>
                </div>
                <input ref={fontInputRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                <FormSelect
                  value={fontValue}
                  onChange={(v) => {
                    if (v === 'custom') {
                      if (settings.customFontName) updateSettings({ documentFont: settings.customFontName })
                      else fontInputRef.current?.click()
                    } else {
                      updateSettings({ documentFont: v })
                    }
                  }}
                  options={[...FONT_OPTIONS, { value: 'custom', label: 'Personnalisé (importer une police)' }]}
                />
                {usingCustomFont ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{settings.customFontName}</p>
                      <p className="text-[11px] text-muted-foreground">Police importée · comptée dans votre stockage</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => fontInputRef.current?.click()} disabled={uploadingFont}>
                        {uploadingFont ? <Spinner /> : 'Remplacer'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleRemoveFont} disabled={removingFont} className="text-destructive hover:text-destructive">
                        {removingFont ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                ) : fontValue === 'custom' ? (
                  <Button variant="outline" size="sm" onClick={() => fontInputRef.current?.click()} disabled={uploadingFont}>
                    {uploadingFont ? <><Spinner /> Envoi…</> : <><Upload className="mr-1.5 h-3.5 w-3.5" /> Importer une police (.ttf, .otf, .woff)</>}
                  </Button>
                ) : null}
              </div>
            </SettingsSection>
          </ProGate>
        </div>

        <div className="mt-7 lg:mt-0">
          <InvoicePreview />
        </div>
      </SettingsSplit>

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
