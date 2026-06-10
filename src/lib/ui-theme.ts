import { saveBackgroundThemeId } from '@/lib/background-themes'

export type UiMode = 'light' | 'dark' | 'system'

export interface UiTheme {
  mode: UiMode
  accent: string | null
  background: string | null
}

export const DEFAULT_ACCENT = '#5957e8'
export const UI_ACCENT_STORAGE_KEY = 'faktur_ui_accent'

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

export const UI_PRESETS: UiPreset[] = [
  {
    id: 'faktur',
    name: 'Faktur',
    description: 'Le thème par défaut, indigo et net',
    theme: { mode: 'system', accent: '#5957e8', background: 'aurore' },
  },
  {
    id: 'minuit',
    name: 'Minuit',
    description: 'Sombre, bleu profond',
    theme: { mode: 'dark', accent: '#3b82f6', background: 'minuit' },
  },
  {
    id: 'cafe',
    name: 'Café',
    description: 'Sombre et chaleureux, ambre doré',
    theme: { mode: 'dark', accent: '#f59e0b', background: 'or' },
  },
  {
    id: 'foret',
    name: 'Forêt',
    description: 'Clair, vert nature',
    theme: { mode: 'light', accent: '#10b981', background: 'foret' },
  },
  {
    id: 'bonbon',
    name: 'Bonbon',
    description: 'Clair, rose pastel',
    theme: { mode: 'light', accent: '#ec4899', background: 'nebuleuse' },
  },
  {
    id: 'ocean',
    name: 'Océan',
    description: 'Clair, cyan marin',
    theme: { mode: 'light', accent: '#06b6d4', background: 'ocean' },
  },
  {
    id: 'carbone',
    name: 'Carbone',
    description: 'Sombre, violet technique',
    theme: { mode: 'dark', accent: '#8b5cf6', background: 'grille' },
  },
  {
    id: 'creme',
    name: 'Crème',
    description: 'Clair, minimal et doux',
    theme: { mode: 'light', accent: '#f59e0b', background: 'papier' },
  },
]

export function parseUiTheme(raw: string | null | undefined): UiTheme {
  const fallback: UiTheme = { mode: 'system', accent: null, background: null }
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
    }
  } catch {
    return fallback
  }
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

export function bootCachedAccent() {
  try {
    const cached = localStorage.getItem(UI_ACCENT_STORAGE_KEY)
    if (cached && /^#[0-9a-fA-F]{6}$/.test(cached)) {
      const root = document.documentElement
      if (cached.toLowerCase() !== DEFAULT_ACCENT) {
        root.style.setProperty('--accent', cached)
        root.style.setProperty('--accent-foreground', '#ffffff')
      }
    }
  } catch {}
}

export function applyUiTheme(theme: UiTheme, setMode?: (mode: UiMode) => void) {
  applyAccent(theme.accent)
  if (theme.background) saveBackgroundThemeId(theme.background)
  if (setMode) setMode(theme.mode)
}

export function serializeUiTheme(theme: UiTheme): string {
  return JSON.stringify(theme)
}
