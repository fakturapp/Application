'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useAuth } from '@/lib/auth'
import { ProGate } from '@/components/billing/pro-gate'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { SettingsPage, SettingsHero, SettingsSection, SettingsRow } from '@/components/settings/settings-shell'
import { FakturAiChatPreview } from '@/components/settings/faktur-ai-chat-preview'
import {
  Sparkles,
  Check,
  Info,
  AlertTriangle,
  Zap,
  Brain,
  Crown,
  Pencil,
  HelpCircle,
  Wand2,
  Shield,
  RefreshCw,
  BarChart3,
} from '@/components/ui/icons'

const MODEL_TIERS = [
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Rapide',
    description: 'Réponses instantanées, idéal pour les tâches simples',
    icon: Zap,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    badge: 'Rapide',
    badgeColor: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Raisonnement',
    description: 'Bon équilibre entre qualité et vitesse',
    icon: Brain,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    badge: 'Recommandé',
    badgeColor: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Pro',
    description: 'Modèle le plus puissant disponible',
    icon: Crown,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    badge: 'Pro',
    badgeColor: 'bg-amber-500/10 text-amber-500',
  },
]

const CHAT_MODES = [
  { id: 'edition' as const, name: 'Édition', description: 'Modifier le contenu du document', icon: Pencil },
  { id: 'question' as const, name: 'Question', description: 'Poser des questions de conformité', icon: HelpCircle },
  { id: 'libre' as const, name: 'Libre', description: 'Instructions libres avec suggestions', icon: Wand2 },
]

function getDefaultMode(): string {
  if (typeof window === 'undefined') return 'edition'
  try {
    const prefs = localStorage.getItem('faktur_ai_chat_pref')
    if (prefs) {
      const parsed = JSON.parse(prefs)
      if (parsed.mode) return parsed.mode
    }
  } catch {}
  return 'edition'
}

function saveDefaultMode(mode: string) {
  try {
    const raw = localStorage.getItem('faktur_ai_chat_pref')
    const prefs = raw ? JSON.parse(raw) : {}
    prefs.mode = mode
    localStorage.setItem('faktur_ai_chat_pref', JSON.stringify(prefs))
  } catch {}
}

interface QuotaBucket {
  used: number
  limit: number
  resetsAt: string
}

interface QuotaData {
  hourly: QuotaBucket
  weekly: QuotaBucket
  allowed: boolean
}

function formatResetTime(iso: string): string {
  const reset = new Date(iso)
  const now = new Date()
  const diffMs = reset.getTime() - now.getTime()
  if (diffMs <= 0) return 'maintenant'
  const totalMin = Math.ceil(diffMs / 60_000)
  if (totalMin < 60) return `dans ${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (m === 0) return `dans ${h} h`
  return `dans ${h} h ${m} min`
}

function formatWeeklyReset(iso: string): string {
  const reset = new Date(iso)
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
  const day = days[reset.getDay()]
  const hours = reset.getHours().toString().padStart(2, '0')
  const mins = reset.getMinutes().toString().padStart(2, '0')
  return `${day} ${hours}:${mins}`
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return '—'
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'il y a moins d’une minute'
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60)
    return `il y a ${m} min`
  }
  const h = Math.floor(diffSec / 3600)
  return `il y a ${h} h`
}

function QuotaBar({
  label,
  bucket,
  reset,
  delay = 0,
}: {
  label: string
  bucket: QuotaBucket
  reset: string
  delay?: number
}) {
  const pct = Math.min((bucket.used / bucket.limit) * 100, 100)
  const barColor = bucket.used >= bucket.limit ? 'bg-red-500' : bucket.used >= bucket.limit * 0.8 ? 'bg-amber-500' : 'bg-accent'
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">Réinitialisation {reset}</p>
      </div>
      <div className="mb-2.5 flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{Math.round((bucket.used / bucket.limit) * 100)} %</span>
        <span className="mb-1 text-xs text-muted-foreground">utilisés</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        {bucket.used} / {bucket.limit} requêtes
      </p>
    </div>
  )
}

export default function FakturAIPage() {
  const { toast } = useToast()
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const { user } = useAuth()
  const isPro = user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team'

  const [showAiBetaModal, setShowAiBetaModal] = useState(false)
  const [defaultMode, setDefaultMode] = useState(getDefaultMode)

  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [, setTick] = useState(0)

  const fetchQuota = useCallback(async () => {
    setQuotaLoading(true)
    try {
      const res = await api.get<{ quota: QuotaData }>('/ai/quota')
      if (res.error || !res.data) return
      setQuota(res.data.quota)
      setLastUpdated(new Date())
    } catch {
      // silent
    } finally {
      setQuotaLoading(false)
    }
  }, [])

  useEffect(() => {
    if (settings.aiEnabled && isPro) fetchQuota()
  }, [settings.aiEnabled, fetchQuota, isPro])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mt-6 space-y-7">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage>
      <SettingsHero
        icon={<Sparkles className="h-6 w-6" />}
        title="Faktur AI"
        tagline="L’assistant intelligent intégré à vos documents."
        description="Modifiez, analysez et optimisez vos factures et devis. 100% gratuit, aucune clé API requise."
      />

      <div className="mt-6">
        <SettingsSection index={1}>
          <FakturAiChatPreview mode={defaultMode as 'edition' | 'question' | 'libre'} active={settings.aiEnabled && isPro} />
        </SettingsSection>

        <ProGate locked={!isPro} description="Passez à Pro pour activer Faktur AI.">
          <SettingsSection index={2}>
            <SettingsRow
              icon={<Sparkles className="h-4 w-4" />}
              title="Activer Faktur AI"
              desc="Active l’assistant IA dans toute l’application."
              control={
                <Switch
                  checked={settings.aiEnabled}
                  onChange={(next) => {
                    if (next) {
                      setShowAiBetaModal(true)
                    } else {
                      updateSettings({ aiEnabled: false })
                      toast('Faktur AI désactivé', 'info')
                    }
                  }}
                />
              }
            />
          </SettingsSection>
        </ProGate>

        {settings.aiEnabled && (
          <>
            <SettingsSection
              index={3}
              title="Limites d’utilisation"
              desc="Votre forfait Faktur AI."
              action={
                <button
                  type="button"
                  onClick={fetchQuota}
                  disabled={quotaLoading}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${quotaLoading ? 'animate-spin' : ''}`} /> Actualiser
                </button>
              }
            >
              <div className="mt-3">
                {quotaLoading && !quota ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </div>
                ) : quota ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <QuotaBar label="Session actuelle" bucket={quota.hourly} reset={formatResetTime(quota.hourly.resetsAt)} />
                      <QuotaBar label="Hebdomadaire" bucket={quota.weekly} reset={formatWeeklyReset(quota.weekly.resetsAt)} delay={0.1} />
                    </div>
                    {!quota.allowed && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <div>
                            <p className="text-xs font-medium text-red-500">Quota dépassé</p>
                            <p className="mt-0.5 text-[11px] text-foreground/70">
                              Vous avez atteint la limite d’utilisation. L’IA sera de nouveau accessible après la réinitialisation.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Dernière mise à jour : {formatLastUpdated(lastUpdated)}
                    </p>
                  </div>
                ) : null}
              </div>
            </SettingsSection>

            <SettingsSection index={4} title="Modèle préféré" desc="Le modèle utilisé par défaut.">
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {MODEL_TIERS.map((tier) => {
                  const TierIcon = tier.icon
                  const isSelected = settings.aiModel === tier.id
                  return (
                    <button
                      key={tier.id}
                      onClick={() => {
                        updateSettings({ aiProvider: 'gemini', aiModel: tier.id })
                        toast(`Modèle ${tier.name} sélectionné`, 'success')
                      }}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tier.iconBg}`}>
                        <TierIcon className={`h-4.5 w-4.5 ${tier.iconColor}`} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{tier.name}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{tier.description}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${tier.badgeColor}`}>
                        {tier.badge}
                      </span>
                    </button>
                  )
                })}
              </div>
            </SettingsSection>

            <SettingsSection index={5} title="Mode par défaut" desc="Le mode utilisé à l’ouverture du chat IA.">
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {CHAT_MODES.map((mode) => {
                  const ModeIcon = mode.icon
                  const isSelected = defaultMode === mode.id
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setDefaultMode(mode.id)
                        saveDefaultMode(mode.id)
                        toast(`Mode ${mode.name} par défaut`, 'success')
                      }}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                        <ModeIcon className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{mode.name}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{mode.description}</p>
                    </button>
                  )
                })}
              </div>
            </SettingsSection>

            <SettingsSection index={6} title="Fonctionnalités & confidentialité">
              <div className="mt-3 space-y-2.5 rounded-xl border border-border p-4">
                {[
                  { text: 'Édition assistée des factures et devis', available: true },
                  { text: 'Analyse de conformité légale', available: true },
                  { text: 'Mode libre créatif', available: true },
                  { text: 'Résumé financier IA sur le tableau de bord', available: false },
                  { text: 'Relances de paiement automatiques', available: false },
                ].map((feature) => (
                  <div key={feature.text} className="flex items-center gap-2.5">
                    {feature.available ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    ) : (
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[9px] text-muted-foreground">—</span>
                    )}
                    <span className={`text-xs ${feature.available ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {feature.text}
                    </span>
                    {!feature.available && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground">Bientôt</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 rounded-xl border border-border p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <p className="text-xs font-semibold text-foreground">Confidentialité</p>
                </div>
                {[
                  'Vos données ne sont pas utilisées pour entraîner les modèles',
                  'Les échanges ne quittent pas votre session active',
                  'Aucune clé API personnelle requise',
                  'Vous pouvez désactiver l’IA à tout moment',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </SettingsSection>
          </>
        )}
      </div>

      <Dialog open={showAiBetaModal} onClose={() => setShowAiBetaModal(false)}>
        <div className="max-w-md p-6">
          <DialogHeader onClose={() => setShowAiBetaModal(false)} icon={<Sparkles className="h-5 w-5 text-accent" />}>
            <DialogTitle>Activer Faktur AI</DialogTitle>
            <DialogDescription>Assistant intelligent intégré</DialogDescription>
          </DialogHeader>
          <div className="mb-6 space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              En activant Faktur AI, vous pourrez utiliser l’assistant dans l’éditeur de factures et devis pour modifier,
              analyser et optimiser vos documents.
            </p>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {[
                'Vérifiez toujours les suggestions de l’IA avant de les appliquer',
                'Les données de vos documents ne quittent pas votre session',
                'Vous pouvez désactiver l’IA à tout moment',
                '100% gratuit — assistant intelligent intégré',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAiBetaModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                updateSettings({ aiEnabled: true, aiProvider: 'gemini', aiModel: 'nvidia/nemotron-3-super-120b-a12b:free' })
                setShowAiBetaModal(false)
                toast('Faktur AI activé', 'success')
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Activer Faktur AI
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </SettingsPage>
  )
}
