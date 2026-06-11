'use client'

import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { useOnboardingNav } from '@/lib/onboarding-nav'
import { cn } from '@/lib/utils'
import {
  ACCENT_COLORS,
  UI_PRESETS,
  UI_ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  applyAccent,
  serializeUiTheme,
  type UiMode,
  type UiPreset,
} from '@/lib/ui-theme'
import {
  BACKGROUND_THEMES,
  loadBackgroundSettings,
  loadBackgroundThemeId,
  saveBackgroundThemeId,
} from '@/lib/background-themes'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  ChevronLeft,
  ChevronRight,
} from '@/components/ui/icons'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const MODES: { id: UiMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'system', label: 'Système', icon: Monitor },
]

export default function OnboardingInterfacePage() {
  const nav = useOnboardingNav()
  const { theme: mode, setTheme: setMode } = useTheme()
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT)
  const [background, setBackground] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setBackground(loadBackgroundThemeId())
    try {
      const cached = localStorage.getItem(UI_ACCENT_STORAGE_KEY)
      if (cached) setAccent(cached)
    } catch {}
  }, [])

  function chooseMode(m: UiMode) {
    setMode(m)
  }

  function chooseAccent(color: string) {
    setAccent(color)
    applyAccent(color)
  }

  function chooseBackground(id: string) {
    setBackground(id)
    saveBackgroundThemeId(id)
  }

  function choosePreset(preset: UiPreset) {
    const t = preset.theme
    setMode(t.mode)
    if (t.accent) {
      setAccent(t.accent)
      applyAccent(t.accent)
    }
    if (t.background) {
      setBackground(t.background)
      saveBackgroundThemeId(t.background)
    }
  }

  const isPresetActive = (preset: UiPreset) =>
    preset.theme.mode === mode &&
    (preset.theme.accent ?? DEFAULT_ACCENT).toLowerCase() === accent.toLowerCase() &&
    preset.theme.background === background

  async function handleContinue() {
    setError('')
    setSaving(true)
    const backgroundSettings = loadBackgroundSettings()
    const { error: err } = await api.put('/account/ui-theme', {
      theme: serializeUiTheme({
        mode,
        accent,
        background,
        backgroundIntensity: backgroundSettings.intensity,
        customBackgroundUrl: backgroundSettings.customUrl,
        customBlur: backgroundSettings.customBlur,
        customDim: backgroundSettings.customDim,
      }),
    })
    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    nav('/onboarding/plan')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-6 flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
              <Palette className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Votre interface</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choisissez votre thème personnel. Il sera synchronisé sur tous vos appareils.
              </p>
            </div>
          </motion.div>

          {error && (
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={fadeUp} custom={1} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Thèmes prêts à l&apos;emploi</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {UI_PRESETS.map((preset) => {
                const active = isPresetActive(preset)
                const presetBg = BACKGROUND_THEMES.find((b) => b.id === preset.theme.background)
                return (
                  <motion.button
                    key={preset.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => choosePreset(preset)}
                    className={cn(
                      'relative flex items-center gap-2 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all',
                      preset.theme.mode === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50',
                      active
                        ? 'border-transparent ring-2 ring-primary'
                        : 'border-border/60 hover:border-border'
                    )}
                  >
                    {presetBg && (
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{ background: presetBg.swatch, opacity: 0.18 }}
                      />
                    )}
                    <span
                      className="relative h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: preset.theme.accent ?? DEFAULT_ACCENT }}
                    />
                    <span
                      className={cn(
                        'relative truncate text-xs font-medium',
                        preset.theme.mode === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
                      )}
                    >
                      {preset.name}
                    </span>
                    {active && (
                      <span className="relative ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Mode</h2>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseMode(id)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    mode === id
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Couleur d&apos;accent</h2>
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_COLORS.map((c) => {
                const active = accent.toLowerCase() === c.color.toLowerCase()
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => chooseAccent(c.color)}
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
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Fond</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {BACKGROUND_THEMES.map((theme) => {
                const active = background === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => chooseBackground(theme.id)}
                    className={cn(
                      'group rounded-xl border p-1.5 text-left transition-all',
                      active
                        ? 'border-transparent ring-2 ring-primary'
                        : 'border-border/60 hover:border-border'
                    )}
                  >
                    <span
                      className="relative block h-9 w-full overflow-hidden rounded-lg"
                      style={{ background: theme.swatch }}
                    >
                      {active && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'mt-1.5 block truncate px-0.5 text-[11px] font-medium',
                        active ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {theme.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => nav('/onboarding/billing')}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => nav('/onboarding/plan')}
              disabled={saving}
            >
              Passer cette étape
            </Button>
            <Button className="flex-1 gap-1.5" onClick={handleContinue} disabled={saving}>
              {saving ? (
                <>
                  <Spinner /> Enregistrement…
                </>
              ) : (
                <>
                  Continuer <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="mt-4">
            <p className="text-center text-xs text-muted-foreground">
              Vous pourrez affiner votre thème à tout moment dans Paramètres, Interface.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
