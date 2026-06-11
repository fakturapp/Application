'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Check,
  Sun,
  Moon,
  Monitor,
  Paintbrush,
  ImagePlus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
} from '@/components/ui/icons'
import {
  BACKGROUND_THEMES,
  CUSTOM_BACKGROUND_ID,
  DEFAULT_BACKGROUND_THEME,
  getBackgroundTheme,
  type BackgroundTheme,
} from '@/lib/background-themes'
import {
  ACCENT_COLORS,
  UI_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND_INTENSITY,
  type UiMode,
  type UiPreset,
} from '@/lib/ui-theme'
import { cn } from '@/lib/utils'

export interface ThemeDraft {
  mode: UiMode
  accent: string
  background: string
  intensity: number
  customBlur: number
  customDim: number
}

export const UI_MODES: { id: UiMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'system', label: 'Système', icon: Monitor },
]

export function modeLabel(mode: UiMode): string {
  return UI_MODES.find((m) => m.id === mode)?.label ?? 'Système'
}

export function accentLabel(accent: string | null): string {
  const value = accent ?? DEFAULT_ACCENT
  return (
    ACCENT_COLORS.find((c) => c.color.toLowerCase() === value.toLowerCase())?.name ??
    value.toUpperCase()
  )
}

export function backgroundLabel(background: string | null): string {
  if (background === CUSTOM_BACKGROUND_ID) return 'Image personnalisée'
  return getBackgroundTheme(background).name
}

export function findMatchingPreset(draft: ThemeDraft): UiPreset | null {
  if (draft.background === CUSTOM_BACKGROUND_ID) return null
  if (draft.intensity !== DEFAULT_BACKGROUND_INTENSITY) return null
  return (
    UI_PRESETS.find(
      (p) =>
        p.theme.mode === draft.mode &&
        (p.theme.accent ?? DEFAULT_ACCENT).toLowerCase() === draft.accent.toLowerCase() &&
        p.theme.background === draft.background
    ) ?? null
  )
}

export function thumbVariant(mode: UiMode): 'light' | 'dark' | undefined {
  return mode === 'system' ? undefined : mode
}

function ThumbLayers({
  theme,
  variant,
  intensity,
}: {
  theme: BackgroundTheme
  variant: 'light' | 'dark'
  intensity: number
}) {
  const layers = variant === 'dark' ? theme.dark : theme.light
  return (
    <>
      {layers.map((layer, i) => (
        <div
          key={`${variant}-${i}`}
          className="absolute inset-0"
          style={{
            background: layer.background,
            backgroundImage: layer.backgroundImage,
            backgroundSize: layer.backgroundSize ? '12px 12px' : undefined,
            opacity: (layer.opacity ?? 1) * intensity,
          }}
        />
      ))}
    </>
  )
}

export function BackgroundThumb({
  background,
  customUrl,
  customBlur = 0,
  customDim = 30,
  intensity = 100,
  forceMode,
  className,
}: {
  background: string | null
  customUrl?: string | null
  customBlur?: number
  customDim?: number
  intensity?: number
  forceMode?: 'light' | 'dark'
  className?: string
}) {
  const factor = intensity / 100

  if (background === CUSTOM_BACKGROUND_ID && customUrl) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          forceMode === 'dark' ? 'bg-zinc-950' : forceMode === 'light' ? 'bg-zinc-50' : 'bg-background',
          className
        )}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${customUrl})`,
            opacity: factor,
            filter: customBlur > 0 ? `blur(${Math.min(customBlur, 12) / 3}px)` : undefined,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${customDim / 100})` }}
        />
      </div>
    )
  }

  const theme = getBackgroundTheme(background)

  if (forceMode) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          forceMode === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50',
          className
        )}
      >
        <ThumbLayers theme={theme} variant={forceMode} intensity={factor} />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-background', className)}>
      <div className="absolute inset-0 dark:hidden">
        <ThumbLayers theme={theme} variant="light" intensity={factor} />
      </div>
      <div className="absolute inset-0 hidden dark:block">
        <ThumbLayers theme={theme} variant="dark" intensity={factor} />
      </div>
    </div>
  )
}

export function ModePicker({
  value,
  onChange,
}: {
  value: UiMode
  onChange: (mode: UiMode) => void
}) {
  return (
    <div className="grid max-w-md grid-cols-3 gap-2">
      {UI_MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
            value === id
              ? 'border-accent/40 bg-accent-soft text-accent'
              : 'border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}

export function AccentPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {ACCENT_COLORS.map((c) => {
        const active = value.toLowerCase() === c.color.toLowerCase()
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={() => onChange(c.color)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110',
              active && 'ring-2 ring-offset-2 ring-offset-card'
            )}
            style={{
              backgroundColor: c.color,
              ...(active ? { ['--tw-ring-color' as string]: c.color } : {}),
            }}
          >
            {active && <Check className="h-4 w-4 text-white" />}
          </button>
        )
      })}
    </div>
  )
}

export function RangeField({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string
  value: number
  unit: string
  min: number
  max: number
  step?: number
  minLabel?: string
  maxLabel?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer rounded-full"
        style={{ accentColor: 'var(--accent)' }}
      />
      {(minLabel || maxLabel) && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

export function CustomBackgroundSection({
  customUrl,
  customBlur,
  customDim,
  uploading,
  isActive,
  onUpload,
  onRemove,
  onUse,
  onBlurChange,
  onDimChange,
}: {
  customUrl: string | null
  customBlur: number
  customDim: number
  uploading: boolean
  isActive: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  onUse?: () => void
  onBlurChange: (value: number) => void
  onDimChange: (value: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = () => inputRef.current?.click()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onUpload(file)
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {customUrl ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <BackgroundThumb
              background={CUSTOM_BACKGROUND_ID}
              customUrl={customUrl}
              customBlur={customBlur}
              customDim={customDim}
              className="aspect-[16/10] w-full shrink-0 rounded-xl border border-border/60 sm:w-48"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Votre image est stockée dans l&apos;espace de votre équipe et compte dans son quota
                de stockage.
              </p>
              <div className="flex flex-wrap gap-2">
                {onUse && !isActive && (
                  <Button size="sm" onClick={onUse}>
                    Utiliser ce fond
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={pick} disabled={uploading}>
                  {uploading ? 'Envoi en cours...' : 'Remplacer'}
                </Button>
                <Button size="sm" variant="danger-soft" onClick={onRemove} disabled={uploading}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RangeField
              label="Flou"
              value={customBlur}
              unit="px"
              min={0}
              max={40}
              minLabel="Net"
              maxLabel="Flouté"
              onChange={onBlurChange}
            />
            <RangeField
              label="Assombrissement"
              value={customDim}
              unit="%"
              min={0}
              max={80}
              minLabel="Aucun"
              maxLabel="Sombre"
              onChange={onDimChange}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center transition-colors hover:border-accent/50 hover:bg-accent-soft/40"
        >
          {uploading ? (
            <Spinner size="sm" className="text-accent" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {uploading ? 'Envoi en cours...' : 'Importer une image de fond'}
          </span>
          <span className="max-w-md text-xs leading-relaxed text-muted-foreground">
            JPG, PNG ou WebP, 8 Mo maximum. L&apos;image est stockée dans l&apos;espace de votre
            équipe et compte dans son quota de stockage.
          </span>
        </button>
      )}
    </div>
  )
}

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: UiPreset
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onSelect} className="text-left">
      <div
        className={cn(
          'relative aspect-[16/10] overflow-hidden rounded-xl transition-all',
          selected
            ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
            : 'border border-border/60 hover:border-border hover:shadow-md'
        )}
      >
        <BackgroundThumb
          background={preset.theme.background}
          forceMode={thumbVariant(preset.theme.mode)}
          className="absolute inset-0"
        />
        <div
          className={cn(
            'absolute left-2 right-6 top-2 rounded-md border p-1.5',
            preset.theme.mode === 'dark'
              ? 'border-white/10 bg-zinc-900/80'
              : 'border-zinc-900/10 bg-white/80'
          )}
        >
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: preset.theme.accent ?? DEFAULT_ACCENT, opacity: 0.8 }}
          />
          <div
            className={cn(
              'mt-1 h-1 w-12 rounded-full',
              preset.theme.mode === 'dark' ? 'bg-white/15' : 'bg-zinc-900/15'
            )}
          />
        </div>
        {selected && (
          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <p className={cn('mt-2 px-0.5 text-xs font-medium', selected ? 'text-accent' : 'text-foreground')}>
        {preset.name}
      </p>
      <p className="px-0.5 text-[11px] text-muted-foreground">{preset.description}</p>
    </motion.button>
  )
}

const CUSTOM_CHOICE = 'personnalise'

export function ThemeStudioModal({
  open,
  onClose,
  initial,
  customUrl,
  uploading,
  onUpload,
  onRemoveCustom,
  onApply,
}: {
  open: boolean
  onClose: () => void
  initial: ThemeDraft
  customUrl: string | null
  uploading: boolean
  onUpload: (file: File) => Promise<string | null>
  onRemoveCustom: () => Promise<void>
  onApply: (draft: ThemeDraft) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [choice, setChoice] = useState<string>(CUSTOM_CHOICE)
  const [draft, setDraft] = useState<ThemeDraft>(initial)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(1)
      setDraft(initial)
      setChoice(findMatchingPreset(initial)?.id ?? CUSTOM_CHOICE)
    }
    wasOpen.current = open
  }, [open, initial])

  const update = (patch: Partial<ThemeDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const goCustomize = () => {
    const preset = UI_PRESETS.find((p) => p.id === choice)
    if (preset) {
      setDraft({
        mode: preset.theme.mode,
        accent: preset.theme.accent ?? DEFAULT_ACCENT,
        background: preset.theme.background ?? DEFAULT_BACKGROUND_THEME,
        intensity: preset.theme.backgroundIntensity,
        customBlur: preset.theme.customBlur,
        customDim: preset.theme.customDim,
      })
    }
    setStep(2)
  }

  const handleUpload = async (file: File) => {
    const url = await onUpload(file)
    if (url) update({ background: CUSTOM_BACKGROUND_ID })
  }

  const handleRemoveCustom = async () => {
    await onRemoveCustom()
    if (draft.background === CUSTOM_BACKGROUND_ID) {
      update({ background: DEFAULT_BACKGROUND_THEME })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="mx-4 max-w-3xl overflow-hidden p-0">
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
              Choisir un thème
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {step === 1
                ? "Étape 1 sur 2 : partez d'un préréglage ou de votre thème actuel"
                : "Étape 2 sur 2 : ajustez chaque détail avant d'appliquer"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2].map((s) => (
                <span
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    s === step ? 'w-6 bg-accent' : 'w-1.5 bg-border'
                  )}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface transition-all hover:bg-surface-hover active:scale-95"
              aria-label="Fermer"
              type="button"
            >
              <X className="h-3.5 w-3.5 text-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <motion.div
                key="step-presets"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {UI_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={choice === preset.id}
                    onSelect={() => setChoice(preset.id)}
                  />
                ))}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setChoice(CUSTOM_CHOICE)}
                  className="text-left"
                >
                  <div
                    className={cn(
                      'relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-surface transition-all',
                      choice === CUSTOM_CHOICE
                        ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
                        : 'border border-dashed border-border hover:border-accent/50 hover:shadow-md'
                    )}
                  >
                    <Paintbrush className="h-6 w-6 text-accent" />
                    {choice === CUSTOM_CHOICE && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-2 px-0.5 text-xs font-medium',
                      choice === CUSTOM_CHOICE ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    Personnalisé
                  </p>
                  <p className="px-0.5 text-[11px] text-muted-foreground">
                    Partez de votre thème actuel et réglez tout vous-même
                  </p>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="step-customize"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Aperçu</h3>
                  <BackgroundThumb
                    background={draft.background}
                    customUrl={customUrl}
                    customBlur={draft.customBlur}
                    customDim={draft.customDim}
                    intensity={draft.intensity}
                    forceMode={thumbVariant(draft.mode)}
                    className="h-24 w-full rounded-xl border border-border/60"
                  />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Mode</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Clair, sombre ou selon votre système
                  </p>
                  <ModePicker value={draft.mode} onChange={(mode) => update({ mode })} />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Couleur d&apos;accent</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    La couleur des boutons, liens et éléments actifs
                  </p>
                  <AccentPicker value={draft.accent} onChange={(accent) => update({ accent })} />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Fond</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    La texture derrière votre espace
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {BACKGROUND_THEMES.map((theme) => {
                      const selected = draft.background === theme.id
                      return (
                        <motion.button
                          key={theme.id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => update({ background: theme.id })}
                          className="text-left"
                        >
                          <div
                            className={cn(
                              'relative aspect-[4/3] overflow-hidden rounded-xl transition-all',
                              selected
                                ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
                                : 'border border-border/60 hover:border-border hover:shadow-md'
                            )}
                          >
                            <BackgroundThumb
                              background={theme.id}
                              forceMode={thumbVariant(draft.mode)}
                              className="absolute inset-0"
                            />
                            {selected && (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p
                            className={cn(
                              'mt-1.5 px-0.5 text-xs font-medium',
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
                        onClick={() => update({ background: CUSTOM_BACKGROUND_ID })}
                        className="text-left"
                      >
                        <div
                          className={cn(
                            'relative aspect-[4/3] overflow-hidden rounded-xl transition-all',
                            draft.background === CUSTOM_BACKGROUND_ID
                              ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
                              : 'border border-border/60 hover:border-border hover:shadow-md'
                          )}
                        >
                          <BackgroundThumb
                            background={CUSTOM_BACKGROUND_ID}
                            customUrl={customUrl}
                            customBlur={draft.customBlur}
                            customDim={draft.customDim}
                            className="absolute inset-0"
                          />
                          {draft.background === CUSTOM_BACKGROUND_ID && (
                            <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p
                          className={cn(
                            'mt-1.5 px-0.5 text-xs font-medium',
                            draft.background === CUSTOM_BACKGROUND_ID
                              ? 'text-accent'
                              : 'text-foreground'
                          )}
                        >
                          Personnalisé
                        </p>
                      </motion.button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Visibilité du fond</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Réglez l&apos;intensité du fond, de discret à bien visible
                  </p>
                  <RangeField
                    label="Visibilité"
                    value={draft.intensity}
                    unit="%"
                    min={20}
                    max={100}
                    step={5}
                    minLabel="Discret"
                    maxLabel="Intense"
                    onChange={(intensity) => update({ intensity })}
                  />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Fond personnalisé</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Utilisez votre propre image comme fond d&apos;écran
                  </p>
                  <CustomBackgroundSection
                    customUrl={customUrl}
                    customBlur={draft.customBlur}
                    customDim={draft.customDim}
                    uploading={uploading}
                    isActive={draft.background === CUSTOM_BACKGROUND_ID}
                    onUpload={handleUpload}
                    onRemove={handleRemoveCustom}
                    onUse={() => update({ background: CUSTOM_BACKGROUND_ID })}
                    onBlurChange={(customBlur) => update({ customBlur })}
                    onDimChange={(customDim) => update({ customDim })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={goCustomize}>
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => onApply(draft)}>
                <Check className="h-4 w-4" />
                Appliquer le thème
              </Button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}
