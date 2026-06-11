'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useOnboardingNav } from '@/lib/onboarding-nav'
import { PLAN_IDS, PLANS, formatPlanPrice } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { PlanRings } from '@/components/plans/plan-rings'
import { AnimatedPrice } from '@/components/plans/animated-price'
import { Check, ChevronLeft, ArrowRight } from '@/components/ui/icons'

export default function OnboardingPlanPage() {
  const router = useRouter()
  const nav = useOnboardingNav()
  const { refreshUser } = useAuth()
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')

  async function handleFinish() {
    setError('')
    setFinishing(true)

    const { error: err } = await api.post('/onboarding/personalization', {})
    if (err) {
      setFinishing(false)
      setError(err)
      return
    }

    localStorage.setItem('faktur_tutorial_offer', 'pending')
    await refreshUser()
    router.replace('/dashboard/settings/plan/upgrade')
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10 space-y-2 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-foreground"
        >
          Choisissez votre forfait
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mx-auto max-w-lg text-sm text-muted-foreground"
        >
          Votre compte est prêt. Découvrez les plans Faktur, vous démarrez gratuitement et changez quand vous voulez.
        </motion.p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="mb-10 flex justify-center"
      >
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              period === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annual')}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              period === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Annuel
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              -37%
            </span>
          </button>
        </div>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-3">
        {PLAN_IDS.map((id, i) => {
          const plan = PLANS[id]
          const price = period === 'annual' ? plan.priceAnnual : plan.priceMonthly
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              className={cn(
                'relative flex flex-col rounded-3xl border bg-card p-8 shadow-surface',
                plan.recommended ? `${plan.accentRing} ring-1 ring-primary/30 md:-mt-3 md:mb-3` : 'border-border'
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                  Recommandé
                </span>
              )}

              <div className="flex items-center gap-3">
                <div className={cn('h-14 w-14 shrink-0', plan.accentText)}>
                  <PlanRings tier={id} />
                </div>
                <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              </div>

              <p className="mt-3 min-h-[2.5rem] text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1">
                {price > 0 ? (
                  <>
                    <AnimatedPrice value={price} className="text-4xl font-bold text-foreground" />
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-foreground">Gratuit</span>
                )}
              </div>
              <p className="mt-1 h-4 text-xs text-muted-foreground">
                {price > 0 ? (
                  period === 'annual' ? (
                    <>
                      soit <AnimatedPrice value={price * 12} /> facturés par an
                    </>
                  ) : (
                    'facturé chaque mois'
                  )
                ) : (
                  'Pour toujours'
                )}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.accentText)} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <Button className="w-full max-w-sm gap-2" size="lg" onClick={handleFinish} disabled={finishing}>
          {finishing ? (
            <>
              <Spinner /> Finalisation…
            </>
          ) : (
            <>
              Terminer et comparer les plans <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => nav('/onboarding/billing')}
          className="gap-1.5"
          disabled={finishing}
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </Button>
      </motion.div>
    </div>
  )
}
