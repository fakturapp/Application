'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { Check, Palette, Sun, Moon, Monitor } from '@/components/ui/icons'
import {
  BACKGROUND_THEMES,
  loadBackgroundThemeId,
  saveBackgroundThemeId,
  type BackgroundTheme,
} from '@/lib/background-themes'
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
import { cn } from '@/lib/utils'

function BackgroundPreview({ theme }: { theme: BackgroundTheme }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {theme.light.map((layer, i) => (
        <div
          key={`l-${i}`}
          className="absolute inset-0 dark:hidden"
          style={{
            background: layer.background,
            backgroundImage: layer.backgroundImage,
            backgroundSize: layer.backgroundSize ? '12px 12px' : undefined,
          }}
        />
      ))}
      {theme.dark.map((layer, i) => (
        <div
          key={`d-${i}`}
          className="absolute inset-0 hidden dark:block"
          style={{
            background: layer.background,
            backgroundImage: layer.backgroundImage,
            backgroundSize: layer.backgroundSize ? '12px 12px' : undefined,
          }}
        />
      ))}
    </div>
  )
}

const MODES: { id: UiMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'system', label: 'Système', icon: Monitor },
]

export default function InterfaceSettingsPage() {
  const { toast } = useToast()
  const { theme: mode, setTheme: setMode } = useTheme()
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT)
  const [background, setBackground] = useState<string | null>(null)

  useEffect(() => {
    setBackground(loadBackgroundThemeId())
    try {
      const cached = localStorage.getItem(UI_ACCENT_STORAGE_KEY)
      if (cached) setAccent(cached)
    } catch {}
  }, [])

  const persist = useCallback(
    (next: { mode: UiMode; accent: string; background: string | null }) => {
      api.put('/account/ui-theme', {
        theme: serializeUiTheme({
          mode: next.mode,
          accent: next.accent,
          background: next.background,
        }),
      })
    },
    []
  )

  const chooseMode = (m: UiMode) => {
    setMode(m)
    persist({ mode: m, accent, background })
  }

  const chooseAccent = (color: string) => {
    setAccent(color)
    applyAccent(color)
    persist({ mode, accent: color, background })
  }

  const chooseBackground = (theme: BackgroundTheme) => {
    setBackground(theme.id)
    saveBackgroundThemeId(theme.id)
    persist({ mode, accent, background: theme.id })
  }

  const choosePreset = (preset: UiPreset) => {
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
    api.put('/account/ui-theme', { theme: serializeUiTheme(t) })
    toast(`Thème ${preset.name} appliqué`, 'success')
  }

  const isPresetActive = (preset: UiPreset) =>
    preset.theme.mode === mode &&
    (preset.theme.accent ?? DEFAULT_ACCENT).toLowerCase() === accent.toLowerCase() &&
    preset.theme.background === background

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
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Thèmes</h2>
              <p className="text-xs text-muted-foreground">
                Un clic applique le mode, la couleur et le fond
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {UI_PRESETS.map((preset) => {
              const active = isPresetActive(preset)
              const presetBg = BACKGROUND_THEMES.find((b) => b.id === preset.theme.background)
              return (
                <motion.button
                  key={preset.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => choosePreset(preset)}
                  className="group text-left"
                >
                  <div
                    className={cn(
                      'relative aspect-[16/10] overflow-hidden rounded-xl transition-all',
                      preset.theme.mode === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50',
                      active
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg'
                        : 'border border-border/60 hover:border-border hover:shadow-md'
                    )}
                  >
                    {presetBg && (
                      <div
                        className="absolute inset-0"
                        style={{ background: presetBg.swatch, opacity: 0.25 }}
                      />
                    )}
                    <div className="absolute left-2 top-2 flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: preset.theme.accent ?? DEFAULT_ACCENT }}
                      />
                      <span
                        className={cn(
                          'h-1.5 w-10 rounded-full',
                          preset.theme.mode === 'dark' ? 'bg-white/25' : 'bg-zinc-900/20'
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        'absolute left-2 top-7 right-5 rounded-md border p-1.5',
                        preset.theme.mode === 'dark'
                          ? 'border-white/10 bg-zinc-900/80'
                          : 'border-zinc-900/10 bg-white/80'
                      )}
                    >
                      <div
                        className="h-1 w-8 rounded-full"
                        style={{ backgroundColor: preset.theme.accent ?? DEFAULT_ACCENT, opacity: 0.7 }}
                      />
                      <div
                        className={cn(
                          'mt-1 h-1 w-12 rounded-full',
                          preset.theme.mode === 'dark' ? 'bg-white/15' : 'bg-zinc-900/15'
                        )}
                      />
                    </div>
                    {active && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-2 px-0.5 text-xs font-medium',
                      active ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {preset.name}
                  </p>
                  <p className="px-0.5 text-[11px] text-muted-foreground">{preset.description}</p>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Mode</h2>
          <p className="text-xs text-muted-foreground mb-4">Clair, sombre ou selon votre système</p>
          <div className="grid max-w-md grid-cols-3 gap-2">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseMode(id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                  mode === id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Couleur d&apos;accent</h2>
          <p className="text-xs text-muted-foreground mb-4">
            La couleur des boutons, liens et éléments actifs
          </p>
          <div className="flex flex-wrap gap-3">
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
                  style={{ backgroundColor: c.color, ...(active ? { ['--tw-ring-color' as string]: c.color } : {}) }}
                >
                  {active && <Check className="h-4 w-4 text-white" />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Fond</h2>
          <p className="text-xs text-muted-foreground mb-4">La texture derrière votre espace</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {BACKGROUND_THEMES.map((theme) => {
              const isSelected = background === theme.id
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => chooseBackground(theme)}
                  className="group text-left"
                >
                  <div
                    className={cn(
                      'relative aspect-[4/3] overflow-hidden rounded-xl transition-all',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg'
                        : 'border border-border/60 hover:border-border hover:shadow-md'
                    )}
                  >
                    <BackgroundPreview theme={theme} />
                    {isSelected && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 px-0.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: theme.swatch }}
                    />
                    <p
                      className={cn(
                        'text-xs font-medium transition-colors',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {theme.name}
                    </p>
                  </div>
                  <p className="px-0.5 text-[11px] text-muted-foreground">{theme.description}</p>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
