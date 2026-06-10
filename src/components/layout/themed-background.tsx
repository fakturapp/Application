'use client'

import { useState, useEffect } from 'react'
import {
  getBackgroundTheme,
  loadBackgroundThemeId,
  BACKGROUND_THEME_EVENT,
  type BackgroundLayer,
} from '@/lib/background-themes'

function layerStyle(layer: BackgroundLayer): React.CSSProperties {
  return {
    background: layer.background,
    backgroundImage: layer.backgroundImage,
    backgroundSize: layer.backgroundSize,
    backgroundPosition: layer.backgroundPosition,
    maskImage: layer.maskImage,
    opacity: layer.opacity,
    animation: layer.animation,
    ...(layer.expand ? { top: -160, left: -160, right: -160, bottom: -160 } : {}),
  }
}

export function ThemedBackground() {
  const [themeId, setThemeId] = useState<string | null>(null)

  useEffect(() => {
    setThemeId(loadBackgroundThemeId())
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail === 'string') setThemeId(detail)
    }
    window.addEventListener(BACKGROUND_THEME_EVENT, handler)
    return () => window.removeEventListener(BACKGROUND_THEME_EVENT, handler)
  }, [])

  const theme = getBackgroundTheme(themeId)

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {theme.light.map((layer, i) => (
        <div key={`l-${theme.id}-${i}`} className="absolute inset-0 dark:hidden" style={layerStyle(layer)} />
      ))}
      {theme.dark.map((layer, i) => (
        <div key={`d-${theme.id}-${i}`} className="absolute inset-0 hidden dark:block" style={layerStyle(layer)} />
      ))}
    </div>
  )
}
