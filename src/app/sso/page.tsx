'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'

const STEPS = ['Connexion réussie', 'Sécurisation de la session', 'Préparation de votre espace']

function safeNext(next: string | null): string {
  if (!next) return '/dashboard'
  try {
    if (next.startsWith('/') && !next.startsWith('//')) {
      return next === '/' ? '/dashboard' : next
    }
    const url = new URL(next)
    if (url.origin === window.location.origin) {
      const path = url.pathname + url.search + url.hash
      return path === '/' ? '/dashboard' : path
    }
  } catch {}
  return '/dashboard'
}

function SsoContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)

  useEffect(() => {
    let cancelled = false
    const next = safeNext(searchParams.get('next'))

    const run = async () => {
      setStep(1)
      const { data } = await api.get<{ user: any }>('/auth/me')
      if (cancelled) return

      setStep(2)
      const delay = data?.user ? 700 : 200
      setTimeout(() => {
        if (!cancelled) window.location.replace(next)
      }, delay)
    }

    const start = setTimeout(run, 500)
    return () => {
      cancelled = true
      clearTimeout(start)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs">
        <div className="space-y-3">
          {STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'pending'
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <span
                  className={
                    state === 'done'
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground'
                      : state === 'active'
                        ? 'flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent border-t-transparent animate-spin'
                        : 'flex h-6 w-6 items-center justify-center rounded-full border border-border'
                  }
                >
                  {state === 'done' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span
                  className={
                    state === 'pending'
                      ? 'text-sm text-muted-foreground'
                      : 'text-sm font-medium text-foreground'
                  }
                >
                  {label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function SsoPage() {
  return (
    <Suspense>
      <SsoContent />
    </Suspense>
  )
}
