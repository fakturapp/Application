'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock, Zap } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

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

interface ProBadgeProps {
  className?: string
  href?: string
  tooltip?: string
  label?: string
}

export function ProBadge({
  className = '',
  href = '/dashboard/settings/plan',
  tooltip = 'Réservé à Faktur Pro. Cliquez pour passer à Pro.',
  label = 'Pro',
}: ProBadgeProps) {
  return (
    <Tooltip content={tooltip} side="top">
      <Link
        href={href}
        className={`inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/20 ${className}`}
      >
        <Zap className="h-3 w-3" />
        {label}
      </Link>
    </Tooltip>
  )
}
