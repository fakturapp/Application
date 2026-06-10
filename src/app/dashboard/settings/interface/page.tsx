'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Check, Palette } from '@/components/ui/icons'
import {
  BACKGROUND_THEMES,
  loadBackgroundThemeId,
  saveBackgroundThemeId,
  type BackgroundTheme,
} from '@/lib/background-themes'
import { cn } from '@/lib/utils'

function ThemePreview({ theme }: { theme: BackgroundTheme }) {
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
      <div className="absolute left-2 top-2 h-1.5 w-10 rounded-full bg-foreground/15" />
      <div className="absolute left-2 top-5 right-6 rounded-md border border-border/70 bg-card/80 p-1.5">
        <div className="h-1 w-8 rounded-full bg-foreground/15" />
        <div className="mt-1 h-1 w-12 rounded-full bg-foreground/8" />
      </div>
    </div>
  )
}

export default function InterfaceSettingsPage() {
  const { toast } = useToast()
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setSelected(loadBackgroundThemeId())
  }, [])

  const choose = (theme: BackgroundTheme) => {
    setSelected(theme.id)
    saveBackgroundThemeId(theme.id)
    toast(`Thème ${theme.name} appliqué`, 'success')
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Interface</h1>
        <p className="text-sm text-muted-foreground">
          Personnalisez le fond de votre espace Faktur
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Thème du fond</h2>
              <p className="text-xs text-muted-foreground">
                Appliqué immédiatement, mémorisé sur cet appareil
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {BACKGROUND_THEMES.map((theme) => {
              const isSelected = selected === theme.id
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => choose(theme)}
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
                    <ThemePreview theme={theme} />
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
