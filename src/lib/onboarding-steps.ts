import {
  Building2,
  Crown,
  Receipt,
  Shield,
  Users,
  type LucideIcon,
} from '@/components/ui/icons'

export interface OnboardingStep {
  id: string
  label: string
  description: string
  path: string
  icon: LucideIcon
  privateOnly?: boolean
  requiresNoTeam?: boolean
  optional?: boolean
  backNavigable?: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'team',
    label: 'Équipe',
    description: 'Nom et chiffrement',
    path: '/onboarding/team',
    icon: Users,
    requiresNoTeam: true,
  },
  {
    id: 'security',
    label: 'Sécurité',
    description: 'Clé de secours',
    path: '/onboarding/recovery-key',
    icon: Shield,
    privateOnly: true,
  },
  {
    id: 'company',
    label: 'Votre entreprise',
    description: 'SIREN ou saisie manuelle',
    path: '/onboarding/company',
    icon: Building2,
    optional: true,
    backNavigable: true,
  },
  {
    id: 'billing',
    label: 'Facturation',
    description: 'Numérotation et paiement',
    path: '/onboarding/billing',
    icon: Receipt,
    optional: true,
    backNavigable: true,
  },
  {
    id: 'plan',
    label: 'Choisir un plan',
    description: 'Dernière étape',
    path: '/onboarding/plan',
    icon: Crown,
  },
]

export const ONBOARDING_ENCRYPTION_EVENT = 'faktur:onboarding-encryption'

export function notifyOnboardingEncryptionMode(mode: 'private' | 'standard') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ONBOARDING_ENCRYPTION_EVENT, { detail: mode }))
}

export function visibleOnboardingSteps(options: {
  hasTeam: boolean
  isPrivate: boolean
}): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((step) => {
    if (step.requiresNoTeam && options.hasTeam) return false
    if (step.privateOnly && !options.isPrivate) return false
    return true
  })
}
