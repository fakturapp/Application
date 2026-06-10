export interface BackgroundLayer {
  background?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  maskImage?: string
  opacity?: number
  animation?: string
  expand?: boolean
}

export interface BackgroundTheme {
  id: string
  name: string
  description: string
  swatch: string
  light: BackgroundLayer[]
  dark: BackgroundLayer[]
}

const DOTS_LIGHT: BackgroundLayer = {
  backgroundImage: 'radial-gradient(rgba(24,24,27,0.05) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.15))',
}

const DOTS_DARK: BackgroundLayer = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.15))',
}

const GRID_LIGHT: BackgroundLayer = {
  backgroundImage:
    'linear-gradient(rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.25) 70%)',
}

const GRID_DARK: BackgroundLayer = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.25) 70%)',
}

function glow(x: string, y: string, color: string, w = 1100, h = 480): BackgroundLayer {
  return { background: `radial-gradient(${w}px ${h}px at ${x} ${y}, ${color}, transparent 70%)` }
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'aurore',
    name: 'Aurore',
    description: 'Halo indigo et grille de points',
    swatch: 'linear-gradient(160deg, rgba(99,102,241,0.55), rgba(99,102,241,0.08))',
    light: [glow('50%', '-160px', 'rgba(99,102,241,0.09)'), DOTS_LIGHT],
    dark: [glow('50%', '-160px', 'rgba(99,102,241,0.12)'), DOTS_DARK],
  },
  {
    id: 'minuit',
    name: 'Minuit',
    description: 'Bleus profonds, calme et sobre',
    swatch: 'linear-gradient(160deg, rgba(37,99,235,0.6), rgba(30,58,138,0.25))',
    light: [
      glow('20%', '-140px', 'rgba(59,130,246,0.10)'),
      glow('85%', '0px', 'rgba(30,64,175,0.07)', 800, 420),
      DOTS_LIGHT,
    ],
    dark: [
      glow('20%', '-140px', 'rgba(59,130,246,0.13)'),
      glow('85%', '0px', 'rgba(30,64,175,0.12)', 800, 420),
      DOTS_DARK,
    ],
  },
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Lueurs chaudes orangées',
    swatch: 'linear-gradient(160deg, rgba(251,146,60,0.6), rgba(244,63,94,0.25))',
    light: [
      glow('15%', '-120px', 'rgba(251,146,60,0.10)', 900, 420),
      glow('90%', '-60px', 'rgba(244,63,94,0.07)', 700, 380),
      DOTS_LIGHT,
    ],
    dark: [
      glow('15%', '-120px', 'rgba(251,146,60,0.10)', 900, 420),
      glow('90%', '-60px', 'rgba(244,63,94,0.09)', 700, 380),
      DOTS_DARK,
    ],
  },
  {
    id: 'ocean',
    name: 'Océan',
    description: 'Cyan apaisant et grille fine',
    swatch: 'linear-gradient(160deg, rgba(6,182,212,0.55), rgba(14,116,144,0.25))',
    light: [
      glow('50%', '-160px', 'rgba(6,182,212,0.09)'),
      glow('8%', '90%', 'rgba(14,165,233,0.06)', 700, 500),
      GRID_LIGHT,
    ],
    dark: [
      glow('50%', '-160px', 'rgba(6,182,212,0.10)'),
      glow('8%', '90%', 'rgba(14,165,233,0.08)', 700, 500),
      GRID_DARK,
    ],
  },
  {
    id: 'foret',
    name: 'Forêt',
    description: 'Verts émeraude, naturel',
    swatch: 'linear-gradient(160deg, rgba(16,185,129,0.55), rgba(5,150,105,0.22))',
    light: [
      glow('30%', '-140px', 'rgba(16,185,129,0.09)'),
      glow('92%', '85%', 'rgba(34,197,94,0.05)', 700, 460),
      DOTS_LIGHT,
    ],
    dark: [
      glow('30%', '-140px', 'rgba(16,185,129,0.10)'),
      glow('92%', '85%', 'rgba(34,197,94,0.07)', 700, 460),
      DOTS_DARK,
    ],
  },
  {
    id: 'nebuleuse',
    name: 'Nébuleuse',
    description: 'Violet et rose, cosmique',
    swatch: 'linear-gradient(160deg, rgba(168,85,247,0.6), rgba(236,72,153,0.3))',
    light: [
      glow('25%', '-140px', 'rgba(168,85,247,0.10)'),
      glow('85%', '10%', 'rgba(236,72,153,0.07)', 800, 420),
      glow('60%', '95%', 'rgba(99,102,241,0.06)', 900, 480),
      DOTS_LIGHT,
    ],
    dark: [
      glow('25%', '-140px', 'rgba(168,85,247,0.12)'),
      glow('85%', '10%', 'rgba(236,72,153,0.09)', 800, 420),
      glow('60%', '95%', 'rgba(99,102,241,0.08)', 900, 480),
      DOTS_DARK,
    ],
  },
  {
    id: 'prisme',
    name: 'Prisme',
    description: 'Pastels multicolores maîtrisés',
    swatch:
      'linear-gradient(120deg, rgba(99,102,241,0.5), rgba(236,72,153,0.4), rgba(45,212,191,0.4))',
    light: [
      glow('10%', '-100px', 'rgba(139,92,246,0.09)', 800, 420),
      glow('55%', '-160px', 'rgba(236,72,153,0.06)', 700, 380),
      glow('95%', '-80px', 'rgba(14,165,233,0.07)', 700, 400),
      glow('20%', '100%', 'rgba(45,212,191,0.05)', 800, 460),
      DOTS_LIGHT,
    ],
    dark: [
      glow('10%', '-100px', 'rgba(139,92,246,0.10)', 800, 420),
      glow('55%', '-160px', 'rgba(236,72,153,0.07)', 700, 380),
      glow('95%', '-80px', 'rgba(14,165,233,0.08)', 700, 400),
      glow('20%', '100%', 'rgba(45,212,191,0.06)', 800, 460),
      DOTS_DARK,
    ],
  },
  {
    id: 'grille',
    name: 'Grille',
    description: 'Quadrillage technique, précis',
    swatch: 'linear-gradient(160deg, rgba(113,113,122,0.5), rgba(113,113,122,0.12))',
    light: [glow('50%', '-180px', 'rgba(99,102,241,0.05)'), GRID_LIGHT],
    dark: [glow('50%', '-180px', 'rgba(99,102,241,0.07)'), GRID_DARK],
  },
  {
    id: 'or',
    name: 'Or',
    description: 'Ambre premium, lumineux',
    swatch: 'linear-gradient(160deg, rgba(245,158,11,0.6), rgba(180,83,9,0.25))',
    light: [
      glow('50%', '-160px', 'rgba(245,158,11,0.09)'),
      glow('5%', '100%', 'rgba(217,119,6,0.05)', 700, 460),
      DOTS_LIGHT,
    ],
    dark: [
      glow('50%', '-160px', 'rgba(245,158,11,0.10)'),
      glow('5%', '100%', 'rgba(217,119,6,0.07)', 700, 460),
      DOTS_DARK,
    ],
  },
  {
    id: 'papier',
    name: 'Papier',
    description: 'Neutre, sans halo, minimal',
    swatch: 'linear-gradient(160deg, rgba(161,161,170,0.35), rgba(161,161,170,0.08))',
    light: [DOTS_LIGHT],
    dark: [DOTS_DARK],
  },
  {
    id: 'flux',
    name: 'Flux',
    description: 'Halos vivants qui dérivent lentement',
    swatch: 'linear-gradient(120deg, rgba(99,102,241,0.55), rgba(236,72,153,0.4), rgba(6,182,212,0.4))',
    light: [
      { ...glow('15%', '5%', 'rgba(99,102,241,0.10)', 800, 500), animation: 'gradient-drift 26s ease-in-out infinite', expand: true },
      { ...glow('80%', '20%', 'rgba(236,72,153,0.07)', 700, 450), animation: 'gradient-drift 34s ease-in-out infinite reverse', expand: true },
      { ...glow('50%', '90%', 'rgba(6,182,212,0.06)', 900, 500), animation: 'gradient-drift 42s ease-in-out infinite', expand: true },
      DOTS_LIGHT,
    ],
    dark: [
      { ...glow('15%', '5%', 'rgba(99,102,241,0.12)', 800, 500), animation: 'gradient-drift 26s ease-in-out infinite', expand: true },
      { ...glow('80%', '20%', 'rgba(236,72,153,0.08)', 700, 450), animation: 'gradient-drift 34s ease-in-out infinite reverse', expand: true },
      { ...glow('50%', '90%', 'rgba(6,182,212,0.07)', 900, 500), animation: 'gradient-drift 42s ease-in-out infinite', expand: true },
      DOTS_DARK,
    ],
  },
  {
    id: 'constellation',
    name: 'Constellation',
    description: 'Points scintillants, halo dérivant',
    swatch: 'linear-gradient(160deg, rgba(139,92,246,0.55), rgba(30,58,138,0.3))',
    light: [
      { ...glow('60%', '-120px', 'rgba(139,92,246,0.10)', 900, 480), animation: 'gradient-drift 30s ease-in-out infinite', expand: true },
      {
        backgroundImage: 'radial-gradient(rgba(24,24,27,0.07) 1.2px, transparent 1.2px)',
        backgroundSize: '34px 34px',
        animation: 'bg-pan 120s linear infinite',
      },
    ],
    dark: [
      { ...glow('60%', '-120px', 'rgba(139,92,246,0.13)', 900, 480), animation: 'gradient-drift 30s ease-in-out infinite', expand: true },
      {
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.2px, transparent 1.2px)',
        backgroundSize: '34px 34px',
        animation: 'bg-pan 120s linear infinite',
      },
    ],
  },
  {
    id: 'vagues',
    name: 'Vagues',
    description: 'Lignes diagonales en mouvement',
    swatch: 'linear-gradient(160deg, rgba(14,165,233,0.5), rgba(45,212,191,0.25))',
    light: [
      glow('50%', '-160px', 'rgba(14,165,233,0.08)'),
      {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(24,24,27,0.035) 0px, rgba(24,24,27,0.035) 1px, transparent 1px, transparent 14px)',
        backgroundSize: '240px 240px',
        animation: 'bg-pan 80s linear infinite',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.25) 70%)',
      },
    ],
    dark: [
      glow('50%', '-160px', 'rgba(14,165,233,0.10)'),
      {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 14px)',
        backgroundSize: '240px 240px',
        animation: 'bg-pan 80s linear infinite',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.25) 70%)',
      },
    ],
  },
  {
    id: 'carreaux',
    name: 'Carreaux',
    description: 'Damier discret, géométrique',
    swatch: 'linear-gradient(160deg, rgba(113,113,122,0.45), rgba(99,102,241,0.2))',
    light: [
      glow('50%', '-180px', 'rgba(99,102,241,0.06)'),
      {
        backgroundImage:
          'linear-gradient(45deg, rgba(24,24,27,0.03) 25%, transparent 25%, transparent 75%, rgba(24,24,27,0.03) 75%), linear-gradient(45deg, rgba(24,24,27,0.03) 25%, transparent 25%, transparent 75%, rgba(24,24,27,0.03) 75%)',
        backgroundSize: '48px 48px, 48px 48px',
        backgroundPosition: '0 0, 24px 24px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 75%)',
      },
    ],
    dark: [
      glow('50%', '-180px', 'rgba(99,102,241,0.08)'),
      {
        backgroundImage:
          'linear-gradient(45deg, rgba(255,255,255,0.028) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.028) 75%), linear-gradient(45deg, rgba(255,255,255,0.028) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.028) 75%)',
        backgroundSize: '48px 48px, 48px 48px',
        backgroundPosition: '0 0, 24px 24px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 75%)',
      },
    ],
  },
  {
    id: 'circuit',
    name: 'Circuit',
    description: 'Grille et nœuds, esprit technique',
    swatch: 'linear-gradient(160deg, rgba(16,185,129,0.5), rgba(113,113,122,0.2))',
    light: [
      glow('20%', '-140px', 'rgba(16,185,129,0.07)', 900, 460),
      GRID_LIGHT,
      {
        backgroundImage: 'radial-gradient(rgba(16,185,129,0.10) 1.5px, transparent 1.5px)',
        backgroundSize: '64px 64px',
        animation: 'bg-pan 160s linear infinite',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 70%)',
      },
    ],
    dark: [
      glow('20%', '-140px', 'rgba(16,185,129,0.09)', 900, 460),
      GRID_DARK,
      {
        backgroundImage: 'radial-gradient(rgba(52,211,153,0.12) 1.5px, transparent 1.5px)',
        backgroundSize: '64px 64px',
        animation: 'bg-pan 160s linear infinite',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 70%)',
      },
    ],
  },
  {
    id: 'pluie',
    name: 'Pluie',
    description: 'Fines lignes qui glissent doucement',
    swatch: 'linear-gradient(180deg, rgba(59,130,246,0.5), rgba(30,64,175,0.2))',
    light: [
      glow('70%', '-140px', 'rgba(59,130,246,0.08)', 900, 460),
      {
        backgroundImage:
          'linear-gradient(180deg, rgba(24,24,27,0.05) 0%, rgba(24,24,27,0.05) 35%, transparent 35%)',
        backgroundSize: '3px 56px',
        animation: 'bg-pan-y 14s linear infinite',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.12) 80%)',
        opacity: 0.7,
      },
    ],
    dark: [
      glow('70%', '-140px', 'rgba(59,130,246,0.10)', 900, 460),
      {
        backgroundImage:
          'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) 35%, transparent 35%)',
        backgroundSize: '3px 56px',
        animation: 'bg-pan-y 14s linear infinite',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.12) 80%)',
        opacity: 0.7,
      },
    ],
  },
]

export const DEFAULT_BACKGROUND_THEME = 'aurore'
export const BACKGROUND_THEME_STORAGE_KEY = 'faktur_bg_theme'
export const BACKGROUND_THEME_EVENT = 'faktur-bg-theme'

export function getBackgroundTheme(id: string | null | undefined): BackgroundTheme {
  return (
    BACKGROUND_THEMES.find((t) => t.id === id) ??
    BACKGROUND_THEMES.find((t) => t.id === DEFAULT_BACKGROUND_THEME)!
  )
}

export function loadBackgroundThemeId(): string {
  try {
    return localStorage.getItem(BACKGROUND_THEME_STORAGE_KEY) || DEFAULT_BACKGROUND_THEME
  } catch {
    return DEFAULT_BACKGROUND_THEME
  }
}

export function saveBackgroundThemeId(id: string) {
  try {
    localStorage.setItem(BACKGROUND_THEME_STORAGE_KEY, id)
  } catch {}
  window.dispatchEvent(new CustomEvent(BACKGROUND_THEME_EVENT, { detail: id }))
}
