'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, LogOut, Moon, Sun } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { OnboardingTeamSwitcher } from '@/components/team/onboarding-team-switcher'
import {
  ONBOARDING_ENCRYPTION_EVENT,
  visibleOnboardingSteps,
  type OnboardingStep,
} from '@/lib/onboarding-steps'

const Iridescence = dynamic(() => import('@/components/ui/iridescence'), { ssr: false })

function StepRow({
  step,
  index,
  state,
  clickable,
  onSelect,
}: {
  step: OnboardingStep
  index: number
  state: 'done' | 'current' | 'upcoming'
  clickable: boolean
  onSelect: () => void
}) {
  const Icon = step.icon
  return (
    <button
      onClick={() => clickable && onSelect()}
      disabled={!clickable}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
        state === 'current' && 'bg-surface',
        state === 'done' && clickable && 'cursor-pointer hover:bg-surface-hover',
        state === 'done' && !clickable && 'cursor-default',
        state === 'upcoming' && 'cursor-not-allowed'
      )}
    >
      {state === 'current' && (
        <motion.span
          layoutId="onboarding-step-indicator"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent"
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      )}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          state === 'current' && 'bg-accent-soft text-accent',
          state === 'done' && 'bg-success-soft text-success',
          state === 'upcoming' && 'bg-surface text-muted-secondary'
        )}
      >
        {state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[13px] font-medium leading-tight',
            state === 'current' && 'text-foreground',
            state === 'done' && 'text-foreground/80',
            state === 'upcoming' && 'text-muted-secondary'
          )}
        >
          {step.label}
        </span>
        <span
          className={cn(
            'block truncate text-[11px] leading-tight',
            state === 'current' ? 'text-muted-foreground' : 'text-muted-secondary'
          )}
        >
          {state === 'done' ? 'Terminé' : step.description}
        </span>
      </span>
      <span
        className={cn(
          'text-[10px] font-mono tabular-nums',
          state === 'current' ? 'font-semibold text-accent' : 'text-muted-secondary'
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
    </button>
  )
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  const [pendingPrivate, setPendingPrivate] = useState(false)
  useEffect(() => {
    function onMode(e: Event) {
      setPendingPrivate((e as CustomEvent).detail === 'private')
    }
    window.addEventListener(ONBOARDING_ENCRYPTION_EVENT, onMode)
    return () => window.removeEventListener(ONBOARDING_ENCRYPTION_EVENT, onMode)
  }, [])

  const hasTeam = !!user?.currentTeamId
  const isPrivate = hasTeam ? user?.currentTeamEncryptionMode === 'private' : pendingPrivate
  const steps = visibleOnboardingSteps({ hasTeam, isPrivate })

  const [navigating, setNavigating] = useState(false)
  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      setNavigating(false)
    }
  }, [pathname])
  useEffect(() => {
    function onStart() {
      setNavigating(true)
    }
    window.addEventListener('faktur:onboarding-navigate', onStart)
    return () => window.removeEventListener('faktur:onboarding-navigate', onStart)
  }, [])

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  if (loading || !user) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0 bg-surface" />
        <div className="fixed inset-0 z-[1] bg-black/10" />
        <div className="fixed inset-y-0 left-0 z-10 hidden w-[280px] flex-col rounded-r-[2rem] bg-overlay shadow-overlay md:flex lg:w-[320px]">
          <div className="space-y-2 px-5 pb-4 pt-6">
            <Skeleton className="h-2 w-16 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-2 w-20 rounded" />
          </div>
          <div className="mx-5 mb-4">
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
          <div className="mx-5 h-px bg-separator" />
          <div className="flex-1 space-y-1 px-4 py-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <div className="mx-5 h-px bg-separator" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="fixed inset-y-0 left-0 right-0 z-[2] flex items-center justify-center md:left-[280px] lg:left-[320px]">
          <div className="w-full max-w-2xl space-y-6 px-10">
            <Skeleton className="mx-auto h-6 w-48 rounded-lg" />
            <Skeleton className="mx-auto h-3 w-64 rounded" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.path))
  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex
  const currentStep = steps[safeIndex]
  const displayName = user.fullName || user.email.split('@')[0]
  const initials = (user.fullName || user.email).slice(0, 2).toUpperCase()

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Iridescence color={[0.4, 0.3, 1]} speed={0.4} amplitude={0.1} />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/25" />

      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-y-0 left-0 z-10 hidden w-[280px] flex-col rounded-r-[2rem] bg-overlay shadow-overlay md:flex lg:w-[320px]"
      >
        <div className="px-5 pb-4 pt-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-secondary">
            Configuration
          </p>
          <p className="text-[15px] font-semibold leading-snug tracking-[-0.015em] text-foreground">
            Configurons votre compte
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Étape {safeIndex + 1} sur {steps.length}
          </p>
        </div>

        <div className="mx-5 mb-4">
          <div className="h-1 overflow-hidden rounded-full bg-surface">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((safeIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-accent"
            />
          </div>
        </div>

        <div className="mx-5 h-px bg-separator" />

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 py-3">
          {steps.map((step, i) => {
            const state = i === safeIndex ? 'current' : i < safeIndex ? 'done' : 'upcoming'
            const clickable = state === 'done' && !!step.backNavigable
            return (
              <StepRow
                key={step.id}
                step={step}
                index={i}
                state={state}
                clickable={clickable}
                onSelect={() => router.push(step.path)}
              />
            )
          })}
        </nav>

        <div className="mx-5 h-px bg-separator" />

        <div className="space-y-2 p-4">
          <OnboardingTeamSwitcher />
          <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2">
            <Avatar src={user.avatarUrl} alt={displayName} fallback={initials} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-tight text-foreground">
                {displayName}
              </p>
              <p className="truncate text-[10.5px] text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              title={resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => void logout()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
              title="Se déconnecter"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>

      <main className="fixed inset-y-0 left-0 right-0 z-[1] overflow-y-auto md:left-[280px] lg:left-[320px]">
        <div className="relative min-h-full">
          <div className="hidden items-center justify-center px-8 pb-2 pt-6 md:flex">
            <Link
              href="/"
              className="flex items-center gap-2.5 drop-shadow-md transition-opacity hover:opacity-80"
            >
              <img src="/logo.svg" alt="Faktur" className="h-7 w-7" />
              <span className="text-base font-semibold tracking-[-0.02em] text-white">Faktur</span>
            </Link>
          </div>

          <div className="px-5 pt-5 md:hidden">
            <div className="flex items-center justify-between rounded-2xl bg-overlay px-4 py-3 shadow-overlay">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.svg" alt="Faktur" className="h-6 w-6" />
                <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                  Faktur
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                  title={resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                  {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => void logout()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-overlay px-4 py-3 shadow-overlay">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-foreground">
                  {currentStep?.label ?? 'Configuration'}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {safeIndex + 1} / {steps.length}
                </p>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((safeIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:px-6 md:px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`w-full ${pathname === '/onboarding/plan' ? 'max-w-6xl' : 'max-w-2xl'}`}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {navigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm"
          >
            <Spinner size="lg" className="text-accent" />
            <p className="mt-4 text-sm font-medium text-foreground">
              Préparation de l&apos;étape suivante…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
