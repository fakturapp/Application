'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { Check, Palette } from '@/components/ui/icons'
import {
  BACKGROUND_THEMES,
  CUSTOM_BACKGROUND_ID,
  DEFAULT_BACKGROUND_THEME,
  loadBackgroundSettings,
  saveBackgroundSettings,
} from '@/lib/background-themes'
import {
  UI_ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND_INTENSITY,
  DEFAULT_CUSTOM_BLUR,
  DEFAULT_CUSTOM_DIM,
  applyAccent,
  serializeUiTheme,
  type UiMode,
  type UiTheme,
} from '@/lib/ui-theme'
import {
  ThemeStudioModal,
  BackgroundThumb,
  ModePicker,
  AccentPicker,
  RangeField,
  CustomBackgroundSection,
  findMatchingPreset,
  modeLabel,
  accentLabel,
  backgroundLabel,
  thumbVariant,
  type ThemeDraft,
} from '@/components/settings/theme-studio-modal'
import { cn } from '@/lib/utils'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export default function InterfaceSettingsPage() {
  const { toast } = useToast()
  const { theme: mode, setTheme: setMode } = useTheme()
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT)
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND_THEME)
  const [intensity, setIntensity] = useState<number>(DEFAULT_BACKGROUND_INTENSITY)
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [customBlur, setCustomBlur] = useState<number>(DEFAULT_CUSTOM_BLUR)
  const [customDim, setCustomDim] = useState<number>(DEFAULT_CUSTOM_DIM)
  const [uploading, setUploading] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const settings = loadBackgroundSettings()
    setBackground(settings.themeId)
    setIntensity(settings.intensity)
    setCustomUrl(settings.customUrl)
    setCustomBlur(settings.customBlur)
    setCustomDim(settings.customDim)
    try {
      const cached = localStorage.getItem(UI_ACCENT_STORAGE_KEY)
      if (cached) setAccent(cached)
    } catch {}
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [])

  const buildTheme = useCallback(
    (patch: Partial<UiTheme> = {}): UiTheme => ({
      mode,
      accent,
      background,
      backgroundIntensity: intensity,
      customBackgroundUrl: customUrl,
      customBlur,
      customDim,
      ...patch,
    }),
    [mode, accent, background, intensity, customUrl, customBlur, customDim]
  )

  const persist = (theme: UiTheme) => {
    api.put('/account/ui-theme', { theme: serializeUiTheme(theme) })
  }

  const persistDebounced = (theme: UiTheme) => {
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => persist(theme), 500)
  }

  const syncBackground = (theme: UiTheme) => {
    saveBackgroundSettings({
      themeId: theme.background ?? DEFAULT_BACKGROUND_THEME,
      intensity: theme.backgroundIntensity,
      customUrl: theme.customBackgroundUrl,
      customBlur: theme.customBlur,
      customDim: theme.customDim,
    })
  }

  const chooseMode = (next: UiMode) => {
    setMode(next)
    persist(buildTheme({ mode: next }))
  }

  const chooseAccent = (color: string) => {
    setAccent(color)
    applyAccent(color)
    persist(buildTheme({ accent: color }))
  }

  const chooseBackground = (id: string) => {
    setBackground(id)
    const theme = buildTheme({ background: id })
    syncBackground(theme)
    persist(theme)
  }

  const changeIntensity = (value: number) => {
    setIntensity(value)
    const theme = buildTheme({ backgroundIntensity: value })
    syncBackground(theme)
    persistDebounced(theme)
  }

  const changeBlur = (value: number) => {
    setCustomBlur(value)
    const theme = buildTheme({ customBlur: value })
    syncBackground(theme)
    persistDebounced(theme)
  }

  const changeDim = (value: number) => {
    setCustomDim(value)
    const theme = buildTheme({ customDim: value })
    syncBackground(theme)
    persistDebounced(theme)
  }

  const uploadCustom = async (file: File): Promise<string | null> => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast('Image trop lourde : 8 Mo maximum', 'error')
      return null
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('background', file)
    const { data, error } = await api.upload<{ backgroundUrl: string }>(
      '/account/ui-background',
      formData
    )
    setUploading(false)
    if (error || !data?.backgroundUrl) {
      toast(error || "Impossible d'importer cette image", 'error')
      return null
    }
    setCustomUrl(data.backgroundUrl)
    setBackground(CUSTOM_BACKGROUND_ID)
    const theme = buildTheme({
      background: CUSTOM_BACKGROUND_ID,
      customBackgroundUrl: data.backgroundUrl,
    })
    syncBackground(theme)
    persist(theme)
    window.dispatchEvent(new Event('faktur:storage-changed'))
    toast('Fond personnalisé importé', 'success')
    return data.backgroundUrl
  }

  const removeCustom = async () => {
    const { error } = await api.delete('/account/ui-background')
    if (error) {
      toast(error, 'error')
      return
    }
    setCustomUrl(null)
    const nextBackground = background === CUSTOM_BACKGROUND_ID ? DEFAULT_BACKGROUND_THEME : background
    setBackground(nextBackground)
    const theme = buildTheme({ background: nextBackground, customBackgroundUrl: null })
    syncBackground(theme)
    window.dispatchEvent(new Event('faktur:storage-changed'))
    toast('Fond personnalisé supprimé', 'success')
  }

  const applyWizard = (draft: ThemeDraft) => {
    setMode(draft.mode)
    setAccent(draft.accent)
    applyAccent(draft.accent)
    setBackground(draft.background)
    setIntensity(draft.intensity)
    setCustomBlur(draft.customBlur)
    setCustomDim(draft.customDim)
    const theme: UiTheme = {
      mode: draft.mode,
      accent: draft.accent,
      background: draft.background,
      backgroundIntensity: draft.intensity,
      customBackgroundUrl: customUrl,
      customBlur: draft.customBlur,
      customDim: draft.customDim,
    }
    syncBackground(theme)
    persist(theme)
    setWizardOpen(false)
    toast('Thème appliqué', 'success')
  }

  const currentDraft: ThemeDraft = {
    mode,
    accent,
    background,
    intensity,
    customBlur,
    customDim,
  }

  const activePreset = findMatchingPreset(currentDraft)

  return (
    <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Interface</h1>
        <p className="text-sm text-muted-foreground">
          Votre thème personnel, synchronisé sur tous vos appareils et sur Mon compte
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <BackgroundThumb
              background={background}
              customUrl={customUrl}
              customBlur={customBlur}
              customDim={customDim}
              intensity={intensity}
              forceMode={thumbVariant(mode)}
              className="aspect-[16/10] w-full shrink-0 rounded-xl border border-border/60 sm:w-52"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Thème actuel
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {activePreset ? activePreset.name : 'Thème personnalisé'}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-foreground">
                  {modeLabel(mode)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                  {accentLabel(accent)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-foreground">
                  {backgroundLabel(background)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-foreground">
                  Visibilité {intensity} %
                </span>
              </div>
            </div>
            <Button onClick={() => setWizardOpen(true)} className="shrink-0">
              <Palette className="h-4 w-4" />
              Choisir un thème
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">Mode</h2>
            <p className="mb-4 text-xs text-muted-foreground">Clair, sombre ou selon votre système</p>
            <ModePicker value={mode} onChange={chooseMode} />
          </div>

          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">Couleur d&apos;accent</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              La couleur des boutons, liens et éléments actifs
            </p>
            <AccentPicker value={accent} onChange={chooseAccent} />
          </div>

          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">Visibilité du fond</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Réglez l&apos;intensité du fond, de discret à bien visible
            </p>
            <div className="max-w-md">
              <RangeField
                label="Visibilité"
                value={intensity}
                unit="%"
                min={20}
                max={100}
                step={5}
                minLabel="Discret"
                maxLabel="Intense"
                onChange={changeIntensity}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Fond</h2>
          <p className="mb-4 text-xs text-muted-foreground">La texture derrière votre espace</p>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {BACKGROUND_THEMES.map((theme) => {
              const selected = background === theme.id
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => chooseBackground(theme.id)}
                  className="w-28 shrink-0 text-left"
                >
                  <div
                    className={cn(
                      'relative aspect-[4/3] overflow-hidden rounded-xl transition-all',
                      selected
                        ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
                        : 'border border-border/60 hover:border-border hover:shadow-md'
                    )}
                  >
                    <BackgroundThumb background={theme.id} className="absolute inset-0" />
                    {selected && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-1.5 truncate px-0.5 text-xs font-medium',
                      selected ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    {theme.name}
                  </p>
                </motion.button>
              )
            })}
            {customUrl && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => chooseBackground(CUSTOM_BACKGROUND_ID)}
                className="w-28 shrink-0 text-left"
              >
                <div
                  className={cn(
                    'relative aspect-[4/3] overflow-hidden rounded-xl transition-all',
                    background === CUSTOM_BACKGROUND_ID
                      ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
                      : 'border border-border/60 hover:border-border hover:shadow-md'
                  )}
                >
                  <BackgroundThumb
                    background={CUSTOM_BACKGROUND_ID}
                    customUrl={customUrl}
                    customBlur={customBlur}
                    customDim={customDim}
                    className="absolute inset-0"
                  />
                  {background === CUSTOM_BACKGROUND_ID && (
                    <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'mt-1.5 truncate px-0.5 text-xs font-medium',
                    background === CUSTOM_BACKGROUND_ID ? 'text-accent' : 'text-foreground'
                  )}
                >
                  Personnalisé
                </p>
              </motion.button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Fond personnalisé</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Utilisez votre propre image comme fond d&apos;écran
          </p>
          <CustomBackgroundSection
            customUrl={customUrl}
            customBlur={customBlur}
            customDim={customDim}
            uploading={uploading}
            isActive={background === CUSTOM_BACKGROUND_ID}
            onUpload={(file) => void uploadCustom(file)}
            onRemove={() => void removeCustom()}
            onUse={() => chooseBackground(CUSTOM_BACKGROUND_ID)}
            onBlurChange={changeBlur}
            onDimChange={changeDim}
          />
        </CardContent>
      </Card>

      <ThemeStudioModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initial={currentDraft}
        customUrl={customUrl}
        uploading={uploading}
        onUpload={uploadCustom}
        onRemoveCustom={removeCustom}
        onApply={applyWizard}
      />
    </div>
  )
}
