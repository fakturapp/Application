'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useOnboardingNav } from '@/lib/onboarding-nav'
import { PLAN_IDS, PLANS, formatPlanPrice } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Check, ChevronLeft, Crown, ArrowRight } from '@/components/ui/icons'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function OnboardingPlanPage() {
  const router = useRouter()
  const nav = useOnboardingNav()
  const { refreshUser } = useAuth()
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')

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
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-6 flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
              <Crown className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Choisissez votre plan</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Votre compte est prêt. Découvrez les plans Faktur : vous démarrez gratuitement et
                changez quand vous voulez.
              </p>
            </div>
          </motion.div>

          {error && (
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            variants={fadeUp}
            custom={1}
            className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {PLAN_IDS.map((planId) => {
              const plan = PLANS[planId]
              const Icon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-4 transition-all',
                    plan.recommended
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-border'
                  )}
                >
                  {plan.recommended && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Recommandé
                    </span>
                  )}
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        plan.accentSoft
                      )}
                    >
                      <Icon className={cn('h-4.5 w-4.5', plan.accentText)} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        {plan.priceMonthly <= 0 ? (
                          'Gratuit pour toujours'
                        ) : (
                          <>
                            <span className="font-medium text-foreground/80">
                              {formatPlanPrice(plan.priceAnnual)}
                            </span>{' '}
                            / mois en annuel
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <Check className={cn('mt-0.5 h-3 w-3 shrink-0', plan.accentText)} />
                        <span className="text-[11.5px] leading-tight text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <Button className="w-full gap-2" size="lg" onClick={handleFinish} disabled={finishing}>
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
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="mt-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => nav('/onboarding/interface')}
              className="gap-1.5"
              disabled={finishing}
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
