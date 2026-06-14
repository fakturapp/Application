import { loadBackgroundSettings, saveBackgroundSettings } from '@/lib/background-themes'

export type UiMode = 'light' | 'dark' | 'system'

export type SurfaceStyle = 'standard' | 'glass' | 'liquid' | 'opaque'

export interface SurfaceSettings {
  surface: SurfaceStyle
  surfaceOpacity: number
  surfaceBlur: number
  surfaceTint: number
}

export interface UiTheme extends SurfaceSettings {
  mode: UiMode
  accent: string | null
  background: string | null
  backgroundIntensity: number
  customBackgroundUrl: string | null
  customBlur: number
  customDim: number
}

export const DEFAULT_ACCENT = '#5957e8'
export const UI_ACCENT_STORAGE_KEY = 'faktur_ui_accent'
export const UI_THEME_COOKIE_NAME = 'faktur_ui_theme'

const THEME_COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.fakturapp.cc'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const DEFAULT_BACKGROUND_INTENSITY = 100
export const MIN_BACKGROUND_INTENSITY = 20
export const MAX_BACKGROUND_INTENSITY = 100
export const DEFAULT_CUSTOM_BLUR = 0
export const MAX_CUSTOM_BLUR = 40
export const DEFAULT_CUSTOM_DIM = 30
export const MAX_CUSTOM_DIM = 80

export const SURFACE_STYLES: SurfaceStyle[] = ['standard', 'glass', 'liquid', 'opaque']
export const DEFAULT_SURFACE: SurfaceStyle = 'standard'
export const DEFAULT_SURFACE_OPACITY = 30
export const MIN_SURFACE_OPACITY = 10
export const MAX_SURFACE_OPACITY = 60
export const DEFAULT_SURFACE_BLUR = 16
export const MIN_SURFACE_BLUR = 4
export const MAX_SURFACE_BLUR = 32
export const DEFAULT_SURFACE_TINT = 0
export const MIN_SURFACE_TINT = 0
export const MAX_SURFACE_TINT = 80

export function parseSurfaceStyle(value: unknown): SurfaceStyle {
  return SURFACE_STYLES.includes(value as SurfaceStyle) ? (value as SurfaceStyle) : DEFAULT_SURFACE
}

export const ACCENT_COLORS = [
  { id: 'indigo', name: 'Indigo', color: '#5957e8' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
  { id: 'bleu', name: 'Bleu', color: '#3b82f6' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'emeraude', name: 'Émeraude', color: '#10b981' },
  { id: 'ambre', name: 'Ambre', color: '#f59e0b' },
  { id: 'rose', name: 'Rose', color: '#ec4899' },
  { id: 'rouge', name: 'Rouge', color: '#ef4444' },
]

export interface UiPreset {
  id: string
  name: string
  description: string
  theme: UiTheme
}

function presetTheme(mode: UiMode, accent: string, background: string): UiTheme {
  return {
    mode,
    accent,
    background,
    backgroundIntensity: DEFAULT_BACKGROUND_INTENSITY,
    customBackgroundUrl: null,
    customBlur: DEFAULT_CUSTOM_BLUR,
    customDim: DEFAULT_CUSTOM_DIM,
    surface: DEFAULT_SURFACE,
    surfaceOpacity: DEFAULT_SURFACE_OPACITY,
    surfaceBlur: DEFAULT_SURFACE_BLUR,
    surfaceTint: DEFAULT_SURFACE_TINT,
  }
}

export const UI_PRESETS: UiPreset[] = [
  {
    id: 'faktur',
    name: 'Faktur',
    description: 'Le thème par défaut, indigo et net',
    theme: presetTheme('system', '#5957e8', 'aurore'),
  },
  {
    id: 'minuit',
    name: 'Minuit',
    description: 'Sombre, bleu profond',
    theme: presetTheme('dark', '#3b82f6', 'minuit'),
  },
  {
    id: 'cafe',
    name: 'Café',
    description: 'Sombre et chaleureux, ambre doré',
    theme: presetTheme('dark', '#f59e0b', 'or'),
  },
  {
    id: 'foret',
    name: 'Forêt',
    description: 'Clair, vert nature',
    theme: presetTheme('light', '#10b981', 'foret'),
  },
  {
    id: 'bonbon',
    name: 'Bonbon',
    description: 'Clair, rose pastel',
    theme: presetTheme('light', '#ec4899', 'nebuleuse'),
  },
  {
    id: 'ocean',
    name: 'Océan',
    description: 'Clair, cyan marin',
    theme: presetTheme('light', '#06b6d4', 'ocean'),
  },
  {
    id: 'carbone',
    name: 'Carbone',
    description: 'Sombre, violet technique',
    theme: presetTheme('dark', '#8b5cf6', 'grille'),
  },
  {
    id: 'creme',
    name: 'Crème',
    description: 'Clair, minimal et doux',
    theme: presetTheme('light', '#f59e0b', 'papier'),
  },
]

export function clampThemeNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, Math.round(num)))
}

export function parseUiTheme(raw: string | null | undefined): UiTheme {
  const fallback: UiTheme = {
    mode: 'system',
    accent: null,
    background: null,
    backgroundIntensity: DEFAULT_BACKGROUND_INTENSITY,
    customBackgroundUrl: null,
    customBlur: DEFAULT_CUSTOM_BLUR,
    customDim: DEFAULT_CUSTOM_DIM,
    surface: DEFAULT_SURFACE,
    surfaceOpacity: DEFAULT_SURFACE_OPACITY,
    surfaceBlur: DEFAULT_SURFACE_BLUR,
    surfaceTint: DEFAULT_SURFACE_TINT,
  }
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return {
      mode: parsed?.mode === 'light' || parsed?.mode === 'dark' ? parsed.mode : 'system',
      accent:
        typeof parsed?.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(parsed.accent)
          ? parsed.accent
          : null,
      background: typeof parsed?.background === 'string' ? parsed.background : null,
      backgroundIntensity: clampThemeNumber(
        parsed?.backgroundIntensity,
        MIN_BACKGROUND_INTENSITY,
        MAX_BACKGROUND_INTENSITY,
        DEFAULT_BACKGROUND_INTENSITY
      ),
      customBackgroundUrl:
        typeof parsed?.customBackgroundUrl === 'string' && parsed.customBackgroundUrl
          ? parsed.customBackgroundUrl
          : null,
      customBlur: clampThemeNumber(parsed?.customBlur, 0, MAX_CUSTOM_BLUR, DEFAULT_CUSTOM_BLUR),
      customDim: clampThemeNumber(parsed?.customDim, 0, MAX_CUSTOM_DIM, DEFAULT_CUSTOM_DIM),
      surface: parseSurfaceStyle(parsed?.surface),
      surfaceOpacity: clampThemeNumber(
        parsed?.surfaceOpacity,
        MIN_SURFACE_OPACITY,
        MAX_SURFACE_OPACITY,
        DEFAULT_SURFACE_OPACITY
      ),
      surfaceBlur: clampThemeNumber(
        parsed?.surfaceBlur,
        MIN_SURFACE_BLUR,
        MAX_SURFACE_BLUR,
        DEFAULT_SURFACE_BLUR
      ),
      surfaceTint: clampThemeNumber(
        parsed?.surfaceTint,
        MIN_SURFACE_TINT,
        MAX_SURFACE_TINT,
        DEFAULT_SURFACE_TINT
      ),
    }
  } catch {
    return fallback
  }
}

export function writeThemeCookie(theme: UiTheme): void {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(serializeUiTheme(theme))
  document.cookie = `${UI_THEME_COOKIE_NAME}=${value}; domain=${THEME_COOKIE_DOMAIN}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; secure; samesite=lax`
}

export function readThemeCookie(): UiTheme | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const cookie of cookies) {
    const eq = cookie.indexOf('=')
    if (eq === -1) continue
    if (cookie.slice(0, eq) === UI_THEME_COOKIE_NAME) {
      const raw = decodeURIComponent(cookie.slice(eq + 1))
      return raw ? parseUiTheme(raw) : null
    }
  }
  return null
}

export function writeThemeCookieMode(mode: UiMode): void {
  const current = readThemeCookie()
  if (!current) return
  writeThemeCookie({ ...current, mode })
}

export function applyAccent(accent: string | null) {
  const root = document.documentElement
  if (accent && accent.toLowerCase() !== DEFAULT_ACCENT) {
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--accent-foreground', '#ffffff')
  } else {
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-foreground')
  }
  try {
    if (accent) localStorage.setItem(UI_ACCENT_STORAGE_KEY, accent)
    else localStorage.removeItem(UI_ACCENT_STORAGE_KEY)
  } catch {}
}

export function applySurface(settings: SurfaceSettings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (settings.surface === 'standard') {
    delete root.dataset.surface
    root.style.removeProperty('--surface-alpha')
    root.style.removeProperty('--surface-blur')
    root.style.removeProperty('--surface-tint')
    return
  }
  root.dataset.surface = settings.surface
  root.style.setProperty('--surface-alpha', `${settings.surfaceOpacity}%`)
  root.style.setProperty('--surface-blur', `${settings.surfaceBlur}px`)
  root.style.setProperty('--surface-tint', `${settings.surfaceTint}%`)
}

export function bootCachedAccent() {
  try {
    const cookieTheme = readThemeCookie()
    const cached = cookieTheme
      ? cookieTheme.accent
      : localStorage.getItem(UI_ACCENT_STORAGE_KEY)
    if (cached && /^#[0-9a-fA-F]{6}$/.test(cached)) {
      const root = document.documentElement
      if (cached.toLowerCase() !== DEFAULT_ACCENT) {
        root.style.setProperty('--accent', cached)
        root.style.setProperty('--accent-foreground', '#ffffff')
      }
    }
    if (cookieTheme) applySurface(cookieTheme)
  } catch {}
}

export function applyUiTheme(theme: UiTheme, setMode?: (mode: UiMode) => void) {
  writeThemeCookie(theme)
  applyAccent(theme.accent)
  applySurface(theme)
  const current = loadBackgroundSettings()
  saveBackgroundSettings({
    themeId: theme.background ?? current.themeId,
    intensity: theme.backgroundIntensity,
    customUrl: theme.customBackgroundUrl,
    customBlur: theme.customBlur,
    customDim: theme.customDim,
  })
  if (setMode) setMode(theme.mode)
}

export function serializeUiTheme(theme: UiTheme): string {
  return JSON.stringify(theme)
}
