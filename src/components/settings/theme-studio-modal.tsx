'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FormSelect } from '@/components/ui/dropdown'
import { GlassSurface } from '@/components/ui/glass-surface'
import {
  Check,
  Sun,
  Moon,
  Monitor,
  Palette,
  Paintbrush,
  ImagePlus,
  Trash2,
  ArrowLeft,
  X,
  AlertTriangle,
} from '@/components/ui/icons'
import {
  BACKGROUND_THEMES,
  CUSTOM_BACKGROUND_ID,
  DEFAULT_BACKGROUND_THEME,
  getBackgroundTheme,
  saveBackgroundSettings,
  type BackgroundTheme,
} from '@/lib/background-themes'
import {
  ACCENT_COLORS,
  UI_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND_INTENSITY,
  DEFAULT_SURFACE,
  MIN_SURFACE_OPACITY,
  MAX_SURFACE_OPACITY,
  MIN_SURFACE_BLUR,
  MAX_SURFACE_BLUR,
  MIN_SURFACE_TINT,
  MAX_SURFACE_TINT,
  applyAccent,
  applySurface,
  detectHardwareAcceleration,
  isLiquidForced,
  setLiquidForced,
  type SurfaceStyle,
  type UiMode,
  type UiPreset,
} from '@/lib/ui-theme'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export interface ThemeDraft {
  mode: UiMode
  accent: string
  background: string
  intensity: number
  customBlur: number
  customDim: number
  surface: SurfaceStyle
  surfaceOpacity: number
  surfaceBlur: number
  surfaceTint: number
}

export const UI_MODES: { id: UiMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'system', label: 'Système', icon: Monitor },
]

export const SURFACE_OPTIONS: { id: SurfaceStyle; name: string; description: string }[] = [
  { id: 'standard', name: 'Standard', description: 'Le rendu classique des cartes' },
  { id: 'glass', name: 'Verre', description: 'Translucide et dépoli' },
  { id: 'liquid', name: 'Liquide', description: 'Verre liquide lumineux' },
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

export function surfaceLabel(surface: SurfaceStyle): string {
  return SURFACE_OPTIONS.find((s) => s.id === surface)?.name ?? 'Standard'
}

export function findMatchingPreset(draft: ThemeDraft): UiPreset | null {
  if (draft.background === CUSTOM_BACKGROUND_ID) return null
  if (draft.intensity !== DEFAULT_BACKGROUND_INTENSITY) return null
  if (draft.surface !== DEFAULT_SURFACE) return null
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

function SurfaceTile({
  option,
  draft,
  selected,
  isDark,
  customUrl,
  onSelect,
  badge,
}: {
  option: { id: SurfaceStyle; name: string; description: string }
  draft: ThemeDraft
  selected: boolean
  isDark: boolean
  customUrl: string | null
  onSelect: () => void
  badge?: ReactNode
}) {
  const glassLike = option.id === 'glass' || option.id === 'liquid'
  const tintFactor = selected ? draft.surfaceTint / 100 : 0
  const baseOpacity = option.id === 'liquid' ? 0.12 : 0.05
  return (
    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onSelect} className="text-left">
      <div
        className={cn(
          'relative aspect-[4/3] overflow-hidden rounded-xl transition-all',
          selected
            ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
            : 'border border-border/60 hover:border-border hover:shadow-md'
        )}
      >
        <BackgroundThumb
          background={draft.background}
          customUrl={customUrl}
          customBlur={draft.customBlur}
          customDim={draft.customDim}
          forceMode={thumbVariant(draft.mode)}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {glassLike ? (
            <GlassSurface
              width="72%"
              height="56%"
              borderRadius={10}
              blur={option.id === 'liquid' ? 14 : 11}
              saturation={option.id === 'liquid' ? 1.6 : 1}
              backgroundOpacity={baseOpacity + tintFactor * 0.5}
              brightness={Math.max(20, (isDark ? 55 : 60) - tintFactor * 35)}
              opacity={option.id === 'liquid' ? 0.9 : 0.93}
            />
          ) : (
            <div
              className={cn(
                'h-[56%] w-[72%] rounded-[10px]',
                isDark ? 'bg-zinc-900' : 'bg-white',
                option.id === 'standard'
                  ? isDark
                    ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.4)]'
                    : 'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]'
                  : isDark
                    ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.14)]'
                    : 'shadow-[0_0_0_1px_rgba(0,0,0,0.16)]'
              )}
            />
          )}
        </div>
        {selected && (
          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent shadow">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <p className={cn('mt-1.5 flex items-center gap-1.5 px-0.5 text-xs font-medium', selected ? 'text-accent' : 'text-foreground')}>
        {option.name}
        {badge}
      </p>
      <p className="px-0.5 text-[11px] text-muted-foreground">{option.description}</p>
    </motion.button>
  )
}

type StudioStep = 'choice' | 'presets' | 'custom'

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
  const { resolvedTheme, setTheme: setMode } = useTheme()
  const [step, setStep] = useState<StudioStep>('choice')
  const [presetChoice, setPresetChoice] = useState<string | null>(null)
  const [draft, setDraft] = useState<ThemeDraft>(initial)
  const initialRef = useRef<ThemeDraft>(initial)
  const appliedRef = useRef(false)
  const wasOpen = useRef(false)
  const [hwAccel, setHwAccel] = useState(true)
  const [liquidForced, setLiquidForcedState] = useState(false)
  const [liquidPromptOpen, setLiquidPromptOpen] = useState(false)
  const [liquidConfirmOpen, setLiquidConfirmOpen] = useState(false)

  useEffect(() => {
    setHwAccel(detectHardwareAcceleration())
    setLiquidForcedState(isLiquidForced())
  }, [])

  const liquidBlocked = !hwAccel && !liquidForced

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep('choice')
      setDraft(initial)
      initialRef.current = initial
      appliedRef.current = false
      setPresetChoice(findMatchingPreset(initial)?.id ?? null)
    }
    wasOpen.current = open
  }, [open, initial])

  const preview = useCallback(
    (d: ThemeDraft) => {
      applyAccent(d.accent)
      applySurface(d)
      saveBackgroundSettings({
        themeId: d.background,
        intensity: d.intensity,
        customUrl,
        customBlur: d.customBlur,
        customDim: d.customDim,
      })
      setMode(d.mode)
    },
    [customUrl, setMode]
  )

  useEffect(() => {
    if (!open) return
    preview(draft)
  }, [open, draft, preview])

  const update = (patch: Partial<ThemeDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
  }

  const choosePreset = (preset: UiPreset) => {
    setPresetChoice(preset.id)
    update({
      mode: preset.theme.mode,
      accent: preset.theme.accent ?? DEFAULT_ACCENT,
      background: preset.theme.background ?? DEFAULT_BACKGROUND_THEME,
      intensity: preset.theme.backgroundIntensity,
      customBlur: preset.theme.customBlur,
      customDim: preset.theme.customDim,
      surface: preset.theme.surface,
      surfaceOpacity: preset.theme.surfaceOpacity,
      surfaceBlur: preset.theme.surfaceBlur,
      surfaceTint: preset.theme.surfaceTint,
    })
  }

  const handleClose = () => {
    if (!appliedRef.current) preview(initialRef.current)
    onClose()
  }

  const handleApply = () => {
    appliedRef.current = true
    onApply(draft)
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

  const isDark =
    draft.mode === 'system' ? resolvedTheme === 'dark' : draft.mode === 'dark'

  const subtitle =
    step === 'choice'
      ? 'Étape 1 sur 2 : choisissez votre point de départ'
      : step === 'presets'
        ? "Étape 2 sur 2 : sélectionnez un thème, l'aperçu s'applique en direct"
        : "Étape 2 sur 2 : ajustez chaque détail, l'aperçu s'applique en direct"

  return (
    <Dialog open={open} onClose={handleClose} className="mx-4 max-w-3xl overflow-hidden p-0">
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            {step !== 'choice' && (
              <button
                onClick={() => setStep('choice')}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface transition-all hover:bg-surface-hover active:scale-95"
                aria-label="Retour"
                type="button"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
                Choisir un thème
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2].map((s) => (
                <span
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    (step === 'choice' ? 1 : 2) === s ? 'w-6 bg-accent' : 'w-1.5 bg-border'
                  )}
                />
              ))}
            </div>
            <button
              onClick={handleClose}
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
            {step === 'choice' && (
              <motion.div
                key="step-choice"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="grid gap-3 sm:grid-cols-2"
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('presets')}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-border p-5 text-left transition-all hover:border-accent/50 hover:bg-accent-soft/30 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft">
                    <Palette className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Thèmes préfaits</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Des ambiances complètes prêtes à l&apos;emploi, appliquées en un clic
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('custom')}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-border p-5 text-left transition-all hover:border-accent/50 hover:bg-accent-soft/30 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft">
                    <Paintbrush className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Personnalisé</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Fond, accent, mode et effets des surfaces : réglez tout vous-même
                    </p>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {step === 'presets' && (
              <motion.div
                key="step-presets"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {UI_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={presetChoice === preset.id}
                    onSelect={() => choosePreset(preset)}
                  />
                ))}
              </motion.div>
            )}

            {step === 'custom' && (
              <motion.div
                key="step-custom"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Type de fond</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    La texture derrière votre espace
                  </p>
                  <FormSelect
                    value={draft.background === CUSTOM_BACKGROUND_ID ? 'custom' : 'builtin'}
                    onChange={(v) => {
                      if (v === 'custom') update({ background: CUSTOM_BACKGROUND_ID })
                      else if (draft.background === CUSTOM_BACKGROUND_ID)
                        update({ background: DEFAULT_BACKGROUND_THEME })
                    }}
                    options={[
                      { value: 'builtin', label: 'Fonds intégrés' },
                      { value: 'custom', label: 'Fond personnalisé' },
                    ]}
                  />

                  {draft.background !== CUSTOM_BACKGROUND_ID ? (
                    <>
                      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                      </div>
                      <div className="mt-4">
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
                    </>
                  ) : (
                    <div className="mt-4">
                      <CustomBackgroundSection
                        customUrl={customUrl}
                        customBlur={draft.customBlur}
                        customDim={draft.customDim}
                        uploading={uploading}
                        isActive={draft.background === CUSTOM_BACKGROUND_ID}
                        onUpload={handleUpload}
                        onRemove={handleRemoveCustom}
                        onBlurChange={(customBlur) => update({ customBlur })}
                        onDimChange={(customDim) => update({ customDim })}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Couleur d&apos;accent</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    La couleur des boutons, liens et éléments actifs
                  </p>
                  <AccentPicker value={draft.accent} onChange={(accent) => update({ accent })} />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Mode</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Clair, sombre ou selon votre système
                  </p>
                  <ModePicker value={draft.mode} onChange={(mode) => update({ mode })} />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Effets des surfaces</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Le rendu des cartes par-dessus votre fond
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SURFACE_OPTIONS.map((option) => {
                      const isLiquid = option.id === 'liquid'
                      const blocked = isLiquid && liquidBlocked
                      return (
                        <div key={option.id} className="relative">
                          <div className={blocked ? 'pointer-events-none opacity-40 grayscale' : ''}>
                            <SurfaceTile
                              option={option}
                              draft={draft}
                              selected={draft.surface === option.id}
                              isDark={isDark}
                              customUrl={customUrl}
                              onSelect={() => update({ surface: option.id })}
                              badge={
                                isLiquid && !hwAccel && liquidForced ? (
                                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-medium text-amber-600 dark:text-amber-400">
                                    Accél. désactivée
                                  </span>
                                ) : null
                              }
                            />
                          </div>
                          {blocked && (
                            <button
                              type="button"
                              onClick={() => setLiquidPromptOpen((v) => !v)}
                              className="absolute inset-0 z-10 cursor-help rounded-xl"
                              aria-label="Mode liquide indisponible"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {liquidBlocked && liquidPromptOpen && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p className="text-xs text-foreground">
                        Le mode liquide est désactivé car l’accélération matérielle n’est pas activée sur votre
                        navigateur.{' '}
                        <button
                          type="button"
                          onClick={() => setLiquidConfirmOpen(true)}
                          className="font-medium text-accent underline underline-offset-2"
                        >
                          Activer quand même
                        </button>
                      </p>
                    </div>
                  )}
                  {(draft.surface === 'glass' || draft.surface === 'liquid') && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <RangeField
                        label="Intensité"
                        value={draft.surfaceOpacity}
                        unit="%"
                        min={MIN_SURFACE_OPACITY}
                        max={MAX_SURFACE_OPACITY}
                        step={5}
                        minLabel="Très transparent"
                        maxLabel="Plus opaque"
                        onChange={(surfaceOpacity) => update({ surfaceOpacity })}
                      />
                      <RangeField
                        label="Flou"
                        value={draft.surfaceBlur}
                        unit="px"
                        min={MIN_SURFACE_BLUR}
                        max={MAX_SURFACE_BLUR}
                        step={2}
                        minLabel="Léger"
                        maxLabel="Marqué"
                        onChange={(surfaceBlur) => update({ surfaceBlur })}
                      />
                      <RangeField
                        label="Teinte"
                        value={draft.surfaceTint}
                        unit="%"
                        min={MIN_SURFACE_TINT}
                        max={MAX_SURFACE_TINT}
                        step={5}
                        minLabel="Clair"
                        maxLabel="Sombre et dense"
                        onChange={(surfaceTint) => update({ surfaceTint })}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          {step === 'choice' ? (
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('choice')}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleApply}>
                <Check className="h-4 w-4" />
                Terminer
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={liquidConfirmOpen} onClose={() => setLiquidConfirmOpen(false)} className="max-w-sm" zIndex="z-[10000]">
        <div className="flex flex-col items-center px-2 pb-1 pt-1 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Activer le mode liquide ?</h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Sans accélération matérielle, l’effet liquid glass entraînera beaucoup de latence et un affichage saccadé.
          </p>
          <div className="mt-6 flex w-full gap-2">
            <Button className="flex-1" variant="outline" onClick={() => setLiquidConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setLiquidForced(true)
                setLiquidForcedState(true)
                setLiquidConfirmOpen(false)
                setLiquidPromptOpen(false)
                update({ surface: 'liquid' })
              }}
            >
              Activer quand même
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog>
  )
}
