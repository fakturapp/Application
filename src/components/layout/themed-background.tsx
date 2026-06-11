'use client'

import { useState, useEffect } from 'react'
import {
  getBackgroundTheme,
  loadBackgroundSettings,
  BACKGROUND_SETTINGS_EVENT,
  BACKGROUND_THEME_EVENT,
  CUSTOM_BACKGROUND_ID,
  type BackgroundLayer,
  type BackgroundSettings,
} from '@/lib/background-themes'

function layerStyle(layer: BackgroundLayer, intensity: number): React.CSSProperties {
  return {
    background: layer.background,
    backgroundImage: layer.backgroundImage,
    backgroundSize: layer.backgroundSize,
    backgroundPosition: layer.backgroundPosition,
    maskImage: layer.maskImage,
    opacity: (layer.opacity ?? 1) * intensity,
    animation: layer.animation,
    ...(layer.expand ? { top: -160, left: -160, right: -160, bottom: -160 } : {}),
  }
}

export function ThemedBackground() {
  const [settings, setSettings] = useState<BackgroundSettings | null>(null)

  useEffect(() => {
    const refresh = () => setSettings(loadBackgroundSettings())
    refresh()
    window.addEventListener(BACKGROUND_SETTINGS_EVENT, refresh)
    window.addEventListener(BACKGROUND_THEME_EVENT, refresh)
    return () => {
      window.removeEventListener(BACKGROUND_SETTINGS_EVENT, refresh)
      window.removeEventListener(BACKGROUND_THEME_EVENT, refresh)
    }
  }, [])

  const intensity = (settings?.intensity ?? 100) / 100

  if (settings?.themeId === CUSTOM_BACKGROUND_ID && settings.customUrl) {
    const bleed = -2 * settings.customBlur
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute bg-cover bg-center"
          style={{
            top: bleed,
            left: bleed,
            right: bleed,
            bottom: bleed,
            backgroundImage: `url(${settings.customUrl})`,
            filter: settings.customBlur > 0 ? `blur(${settings.customBlur}px)` : undefined,
            opacity: intensity,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${settings.customDim / 100})` }}
        />
      </div>
    )
  }

  const theme = getBackgroundTheme(settings?.themeId)

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {theme.light.map((layer, i) => (
        <div key={`l-${theme.id}-${i}`} className="absolute inset-0 dark:hidden" style={layerStyle(layer, intensity)} />
      ))}
      {theme.dark.map((layer, i) => (
        <div key={`d-${theme.id}-${i}`} className="absolute inset-0 hidden dark:block" style={layerStyle(layer, intensity)} />
      ))}
    </div>
  )
}
