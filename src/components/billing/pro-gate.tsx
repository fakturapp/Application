'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

interface ProGateProps {
  locked: boolean
  title?: string
  description?: string
  href?: string
  children: ReactNode
}

export function ProGate({
  locked,
  title = 'Réservé à Faktur Pro',
  description = 'Passez à Pro pour personnaliser vos factures.',
  href = '/dashboard/settings/plan',
  children,
}: ProGateProps) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card/95 p-6 text-center shadow-lg backdrop-blur-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <Link href={href} className="mt-4 inline-flex">
            <Button size="sm">Passer à Pro</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
